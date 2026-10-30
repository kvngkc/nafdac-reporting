import Link from "next/link";
import { notFound } from "next/navigation";
import type { Category } from "@prisma/client";
import { prisma } from "@/lib/db";
import { countBy, dailySeries } from "@/lib/analytics";
import { CATEGORY_LABELS } from "@/lib/labels";
import { describeProductKey } from "@/lib/normalize";
import { RankBarChart, TrendChart } from "@/components/charts/Charts";
import { SeverityBadge, StatusBadge, formatDate } from "@/components/ui";

export default async function ProductPage({ params }: { params: Promise<{ key: string }> }) {
  const productKey = decodeURIComponent((await params).key);
  const where = { productKey };
  const [complaints, byState, byCategory, series] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, trackingCode: true, productName: true, brand: true, batchNo: true, state: true, lga: true, severity: true, status: true, createdAt: true, healthEffect: true },
    }),
    countBy("state", null, where),
    countBy("category", null, where),
    dailySeries(90, productKey),
  ]);
  if (complaints.length === 0) notFound();

  const total = byState.reduce((s, r) => s + r.count, 0);
  const ill = complaints.filter((c) => c.healthEffect).length;
  const batches = [...new Set(complaints.map((c) => c.batchNo).filter(Boolean))];

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-brand-700 hover:underline">
        ← Dashboard
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{complaints[0].productName}</h1>
          <p className="text-sm text-slate-500">{describeProductKey(productKey)}</p>
        </div>
        <Link href={`/admin/complaints?productKey=${encodeURIComponent(productKey)}`} className="btn-secondary">
          Filter &amp; export these complaints
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total reports", total],
          ["States", byState.length],
          ["Illness reported", ill],
          ["Batches named", batches.length],
        ].map(([l, v]) => (
          <div key={l} className="card p-4">
            <span className="block text-xs font-medium text-slate-500">{l}</span>
            <span className="mt-1 block text-2xl font-bold tabular-nums">{v}</span>
          </div>
        ))}
      </div>
      {batches.length > 0 && (
        <p className="text-sm text-slate-600">
          <span className="font-medium">Batch numbers reported:</span> {batches.join(", ")}
        </p>
      )}

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Reports per day (last 90 days)</h2>
        <TrendChart data={series} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">By state</h2>
          <RankBarChart data={byState.map((s) => ({ name: s.key, count: s.count }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">By problem</h2>
          <RankBarChart data={byCategory.map((c) => ({ name: CATEGORY_LABELS[c.key as Category], count: c.count }))} />
        </section>
      </div>

      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Received</th>
              <th className="px-4 py-2 font-medium">Location</th>
              <th className="px-4 py-2 font-medium">Batch</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/admin/complaints/${c.id}`} className="text-brand-700 hover:underline">
                    {formatDate(c.createdAt)}
                  </Link>
                  <span className="block font-mono text-xs text-slate-500">{c.trackingCode}</span>
                </td>
                <td className="px-4 py-2">
                  {c.lga}, {c.state}
                </td>
                <td className="px-4 py-2">{c.batchNo ?? "—"}</td>
                <td className="px-4 py-2">
                  <SeverityBadge severity={c.severity} />
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
