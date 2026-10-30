"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { STATUS_UPDATE } from "@/lib/validation/complaint";

export async function updateStatus(_prev: string | null, formData: FormData): Promise<string | null> {
  const admin = await requireAdmin();
  const parsed = STATUS_UPDATE.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return "Invalid status update.";
  const { complaintId, status, note } = parsed.data;

  const current = await prisma.complaint.findUnique({ where: { id: complaintId }, select: { status: true } });
  if (!current) return "Complaint not found.";
  if (current.status === status && !note) return "Choose a different status or add a note.";

  await prisma.$transaction([
    prisma.complaint.update({ where: { id: complaintId }, data: { status } }),
    prisma.statusChange.create({ data: { complaintId, from: current.status, to: status, note, adminId: admin.id } }),
  ]);
  revalidatePath(`/admin/complaints/${complaintId}`);
  return null;
}
