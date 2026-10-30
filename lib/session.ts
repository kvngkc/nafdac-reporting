import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type AdminSession = { id: string; email: string; name: string; role: "ADMIN" | "ANALYST" };

/** Server-side guard for admin pages and actions; middleware is only the first line of defence. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth();
  const u = session?.user as Partial<AdminSession> | undefined;
  if (!u?.id) redirect("/admin/login");
  return u as AdminSession;
}
