import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import type { Category, ProductType } from "@prisma/client";
import { countBy, dailySeries, getHotspots, getKpis, productAggregates, sinceDate } from "@/lib/analytics";
import { CATEGORY_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/labels";
import { describeProductKey } from "@/lib/normalize";
import { RankBarChart, TrendChart } from "@/components/charts/Charts";
import { SeverityBadge, formatDate } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const RANGES = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "12 months" },
  { value: "all", label: "All time" },
];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: rawDays = "90" } = await searchParams;
  const days = RANGES.some((r) => r.value === rawDays) ? rawDays : "90";
  const since = days === "all" ? null : sinceDate(Number(days));
  const trendDays = days === "all" || days === "365" ? 90 : Number(days);

  const [kpis, series, byCategory, byType, byState, products, hotspots] = await Promise.all([
    getKpis(since),
    dailySeries(trendDays),
    countBy("category", since),
    countBy("productType", since),
    countBy("state", since),
    productAggregates(since, 10),
    getHotspots(),
  ]);

  const rangeQuery = (extra: string) => {
    const from = since ? `from=${since.toISOString().slice(0, 10)}&` : "";
    return `/admin/complaints?${from}${extra}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-slate-500">Consumer complaints about food and drug products across Nigeria</p>
        </div>
        <nav className="flex rounded-lg border border-slate-200 bg-white p-1 text-sm" aria-label="Date range">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin?days=${r.value}`}
              aria-current={r.value === days ? "page" : undefined}
              className={clsx(
                "rounded-md px-3 py-1.5 font-medium",
                r.value === days ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Complaints in range" value={kpis.total} href={rangeQuery("")} />
        <Kpi label="Last 7 days" value={kpis.last7} />
        <Kpi label="Last 30 days" value={kpis.last30} />
        <Kpi label="Awaiting review" value={kpis.open} href={rangeQuery("status=NEW")} />
        <Kpi label="People fell ill" value={kpis.health} href={rangeQuery("health=1")} tone="warn" />
        <Kpi label="Hospitalised" value={kpis.critical} href={rangeQuery("severity=CRITICAL")} tone="danger" />
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-semibold">Hotspot alerts</h2>
        <p className="mb-4 text-sm text-slate-500">
          Products with a spike in reports, spread across several states, or linked to illness (last 30 days).
        </p>
        {hotspots.productAlerts.length === 0 && hotspots.critical.length === 0 ? (
          <p className="text-sm text-slate-500">No active alerts.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <ul className="space-y-2 lg:col-span-2">
              {hotspots.productAlerts.slice(0, 6).map((h) => (
                <li key={h.productKey}>
                  <Link
                    href={`/admin/products/${encodeURIComponent(h.productKey)}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 hover:border-orange-400"
                  >
                    <span>
                      <span className="block font-semibold">
                        {h.productName}
                        {h.brand && <span className="font-normal text-slate-500"> · {h.brand}</span>}
                      </span>
                      <span className="block text-xs text-slate-600">
                        {h.nafdacRegNo ? `NAFDAC ${h.nafdacRegNo} · ` : ""}
                        {CATEGORY_LABELS[h.topCategory as Category]}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {h.reasons.map((r) => (
                          <span key={r} className="rounded bg-white px-1.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-orange-200">
                            {r}
                          </span>
                        ))}
                      </span>
                    </span>
                    <SeverityBadge severity={h.maxSeverity} />
                  </Link>
                </li>
              ))}
            </ul>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-red-700">Hospitalisations awaiting review</h3>
              {hotspots.critical.length === 0 && <p className="text-sm text-slate-500">None.</p>}
              <ul className="space-y-2">
                {hotspots.critical.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/complaints/${c.id}`} className="block rounded-lg border border-red-200 bg-red-50 p-3 text-sm hover:border-red-400">
                      <span className="font-semibold">{c.productName}</span>
                      <span className="block text-xs text-slate-600">
                        {c.lga}, {c.state} · {formatDate(c.createdAt)} · {c.trackingCode}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Complaints per day</h2>
        <p className="mb-3 text-sm text-slate-500">Last {trendDays} days</p>
        <TrendChart data={series} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">By problem category</h2>
          <RankBarChart data={byCategory.map((c) => ({ name: CATEGORY_LABELS[c.key as Category], count: c.count }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">By product type</h2>
          <RankBarChart data={byType.map((c) => ({ name: PRODUCT_TYPE_LABELS[c.key as ProductType], count: c.count }))} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Top 15 states</h2>
          <RankBarChart data={byState.slice(0, 15).map((s) => ({ name: s.key, count: s.count }))} />
        </section>
        <section className="card overflow-hidden lg:col-span-3">
          <h2 className="p-5 pb-3 font-semibold">Most reported products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 text-right font-medium">Reports</th>
                  <th className="px-3 py-2 text-right font-medium">States</th>
                  <th className="px-3 py-2 text-right font-medium">Ill</th>
                  <th className="px-3 py-2 font-medium">Worst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.productKey} className="hover:bg-slate-50">
                    <td className="px-5 py-2">
                      <Link href={`/admin/products/${encodeURIComponent(p.productKey)}`} className="font-medium text-brand-700 hover:underline">
                        {p.productName}
                      </Link>
                      <span className="block text-xs text-slate-500">{describeProductKey(p.productKey)}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{p.total}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.states}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.health}</td>
                    <td className="px-3 py-2">
                      <SeverityBadge severity={p.maxSeverity} />
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                      No complaints in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: "warn" | "danger" }) {
  const body = (
    <>
      <span className="block text-xs font-medium text-slate-500">{label}</span>
      <span
        className={clsx(
          "mt-1 block text-2xl font-bold tabular-nums",
          tone === "danger" && value > 0 && "text-red-700",
          tone === "warn" && value > 0 && "text-orange-700",
        )}
      >
        {value.toLocaleString()}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 hover:border-brand-600">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}
