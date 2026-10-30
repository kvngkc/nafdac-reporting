import { createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { RATE_LIMIT } from "@/lib/config";

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex");
}

/** Fixed-window counter in Postgres. Returns false when the caller is over the limit. */
export async function consumeRateLimit(key: string, limit = RATE_LIMIT.submissions, windowMinutes = RATE_LIMIT.windowMinutes) {
  const windowMs = windowMinutes * 60_000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const row = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  return row.count <= limit;
}
