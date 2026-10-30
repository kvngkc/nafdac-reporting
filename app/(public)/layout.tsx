import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm text-white">
              NR
            </span>
            <span className="leading-tight">
              Product Safety
              <span className="block text-xs font-medium text-slate-500">Report to NAFDAC</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-3">
            <Link href="/track" className="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100">
              Track
            </Link>
            <Link href="/report" className="btn-primary px-3 py-1.5">
              Report
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-slate-500">
          <p>
            This is an independent citizen reporting platform. Reports are reviewed and aggregated before being shared
            with the National Agency for Food and Drug Administration and Control (NAFDAC).
          </p>
          <p>
            You can also contact NAFDAC directly through the official channels listed at{" "}
            <a className="text-brand-700 underline" href="https://www.nafdac.gov.ng" target="_blank" rel="noreferrer">
              nafdac.gov.ng
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
