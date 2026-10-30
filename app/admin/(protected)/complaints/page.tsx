import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { filtersToQuery, filtersToWhere, parseComplaintFilters, type SearchParams } from "@/lib/filters";
import { CATEGORY_LABELS } from "@/lib/labels";
import { describeProductKey } from "@/lib/normalize";
import { ComplaintFiltersForm } from "@/components/admin/ComplaintFilters";
import { SeverityBadge, StatusBadge, formatDate } from "@/components/ui";

export const metadata: Metadata = { title: "Complaints" };

const PAGE_SIZE = 25;

export default async function ComplaintsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseComplaintFilters(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = filtersToWhere(f);

  const [total, rows] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        trackingCode: true,
        productName: true,
        brand: true,
        nafdacRegNo: true,
        category: true,
        state: true,
        lga: true,
        severity: true,
        status: true,
        healthEffect: true,
        createdAt: true,
        _count: { select: { evidence: true } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Complaints</h1>
          <p className="text-sm text-slate-500">
            {total.toLocaleString()} matching
            {f.productKey && <> · product: {describeProductKey(f.productKey)}</>}
          </p>
        </div>
        <a href={`/admin/complaints/export?${filtersToQuery(f)}`} className="btn-secondary">
          Download CSV
        </a>
      </div>

      <ComplaintFiltersForm f={f} />

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Received</th>
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Location</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="block">{formatDate(c.createdAt)}</span>
                  <span className="font-mono text-xs text-slate-500">{c.trackingCode}</span>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/complaints/${c.id}`} className="font-medium text-brand-700 hover:underline">
                    {c.productName}
                  </Link>
                  <span className="block text-xs text-slate-500">
                    {[c.brand, c.nafdacRegNo && `NAFDAC ${c.nafdacRegNo}`].filter(Boolean).join(" · ") || "—"}
                    {c._count.evidence > 0 && ` · ${c._count.evidence} photo${c._count.evidence > 1 ? "s" : ""}`}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {CATEGORY_LABELS[c.category]}
                  {c.healthEffect && <span className="block text-xs font-medium text-orange-700">Illness reported</span>}
                </td>
                <td className="px-4 py-2.5">
                  {c.lga}
                  <span className="block text-xs text-slate-500">{c.state}</span>
                </td>
                <td className="px-4 py-2.5">
                  <SeverityBadge severity={c.severity} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No complaints match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-slate-500">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link className="btn-secondary" href={`/admin/complaints?${filtersToQuery(f, { page: page - 1 })}`}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link className="btn-secondary" href={`/admin/complaints?${filtersToQuery(f, { page: page + 1 })}`}>
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
