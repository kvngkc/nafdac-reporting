import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { normalizeTrackingCode } from "@/lib/tracking";
import { STATUS_LABELS } from "@/lib/labels";
import { StatusBadge, formatDate } from "@/components/ui";

export const metadata: Metadata = { title: "Track a report" };

const STATUS_HELP = {
  NEW: "We have received your report and it is waiting to be reviewed.",
  UNDER_REVIEW: "Our team is reviewing your report and any similar reports.",
  FORWARDED: "Your report has been included in a report forwarded to NAFDAC for investigation.",
  RESOLVED: "This report has been resolved.",
  DISMISSED: "This report was reviewed and closed without further action.",
} as const;

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: rawCode } = await searchParams;
  const code = rawCode?.trim() ? normalizeTrackingCode(rawCode) : null;
  // Only non-personal fields are selected here; this page is public.
  const complaint = code
    ? await prisma.complaint.findUnique({
        where: { trackingCode: code },
        select: { trackingCode: true, productName: true, status: true, createdAt: true, updatedAt: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">Track your report</h1>
      <form className="mt-4 flex gap-2" action="/track">
        <label htmlFor="code" className="sr-only">
          Tracking code
        </label>
        <input
          id="code"
          name="code"
          defaultValue={rawCode ?? ""}
          placeholder="NR-XXXXXX"
          className="input font-mono uppercase"
          autoCapitalize="characters"
          required
        />
        <button className="btn-primary">Check</button>
      </form>

      {code && !complaint && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No report found with code <span className="font-mono">{code}</span>. Check the code and try again.
        </p>
      )}

      {complaint && (
        <div className="card mt-6 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-slate-500">{complaint.trackingCode}</p>
              <p className="font-semibold">{complaint.productName}</p>
            </div>
            <StatusBadge status={complaint.status} />
          </div>
          <p className="mt-3 text-sm text-slate-700" data-testid="track-status">
            <span className="sr-only">{STATUS_LABELS[complaint.status]}: </span>
            {STATUS_HELP[complaint.status]}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Submitted</dt>
            <dd>{formatDate(complaint.createdAt)}</dd>
            <dt className="text-slate-500">Last updated</dt>
            <dd>{formatDate(complaint.updatedAt)}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
