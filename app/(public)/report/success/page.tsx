import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Report received" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-2xl text-brand-700" aria-hidden>
        ✓
      </div>
      <h1 className="text-2xl font-bold">Thank you – your report was received</h1>
      <p className="mt-2 text-slate-600">
        Your report helps protect other Nigerians. It will be reviewed and included in reports sent to NAFDAC.
      </p>
      {code && (
        <div className="card mx-auto mt-6 max-w-sm p-5">
          <p className="text-sm text-slate-500">Your tracking code</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-brand-700" data-testid="tracking-code">
            {code}
          </p>
          <p className="mt-2 text-xs text-slate-500">Write it down or take a screenshot to check the status later.</p>
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={code ? `/track?code=${encodeURIComponent(code)}` : "/track"} className="btn-secondary">
          Track this report
        </Link>
        <Link href="/report" className="btn-primary">
          Report another product
        </Link>
      </div>
    </div>
  );
}
