import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-bold text-brand-700">
              NAFDAC Reports
            </Link>
            <nav className="flex gap-1 text-sm font-medium">
              <Link href="/admin" className="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100">
                Dashboard
              </Link>
              <Link href="/admin/complaints" className="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100">
                Complaints
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">
              {user.name} · {user.role.toLowerCase()}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button className="btn-secondary px-3 py-1.5">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
