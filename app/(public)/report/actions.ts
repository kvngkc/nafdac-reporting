"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { complaintSchema } from "@/lib/validation/complaint";
import { computeSeverity } from "@/lib/severity";
import { normalizeRegNo, normalizeText, productKey } from "@/lib/normalize";
import { generateTrackingCode } from "@/lib/tracking";
import { clientIpHash, consumeRateLimit } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { storeEvidence, UploadError } from "@/lib/storage";
import { UPLOADS } from "@/lib/config";

export type SubmitState =
  | { ok: true; trackingCode: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

export async function submitComplaint(formData: FormData): Promise<SubmitState> {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([k, v]) => typeof v === "string" && k !== "evidence" && !k.startsWith("cf-")),
  );
  const parsed = complaintSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ipHash = await clientIpHash();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(await verifyCaptcha(formData.get("cf-turnstile-response") as string | null, ip))) {
    return { ok: false, message: "Please complete the security check and try again." };
  }
  if (!(await consumeRateLimit(`submit:${ipHash}`))) {
    return { ok: false, message: "Too many reports from this connection. Please try again in an hour." };
  }

  const files = formData.getAll("evidence").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > UPLOADS.maxFiles) {
    return { ok: false, message: `You can attach at most ${UPLOADS.maxFiles} photos.` };
  }

  let stored: Awaited<ReturnType<typeof storeEvidence>>[];
  try {
    stored = await Promise.all(files.map(storeEvidence));
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, message: e.message, fieldErrors: { evidence: [e.message] } };
    throw e;
  }

  const d = parsed.data;
  const data = {
    ...d,
    contactPhone: d.contactPhone?.replace(/[\s-]/g, ""),
    contactEmail: d.contactEmail?.toLowerCase(),
    nafdacRegNo: normalizeRegNo(d.nafdacRegNo),
    productNameNormalized: normalizeText(d.productName),
    productKey: productKey(d),
    severity: computeSeverity(d),
    ipHash,
    evidence: { create: stored },
  };

  // Retry on the (very unlikely) tracking-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const c = await prisma.complaint.create({
        data: { ...data, trackingCode: generateTrackingCode() },
        select: { trackingCode: true },
      });
      return { ok: true, trackingCode: c.trackingCode };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { ok: false, message: "Something went wrong. Please try again." };
}
