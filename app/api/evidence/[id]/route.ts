import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { readEvidence } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const ev = await prisma.evidence.findUnique({ where: { id } });
  if (!ev) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await readEvidence(ev);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": ev.mimeType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
