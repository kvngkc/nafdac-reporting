import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS, PRODUCT_TYPE_LABELS, STATUS_LABELS } from "@/lib/labels";
import { describeProductKey } from "@/lib/normalize";
import { SeverityBadge, StatusBadge, formatDate } from "@/components/ui";
import { StatusForm } from "./StatusForm";

export default async function ComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.complaint.findUnique({
    where: { id },
    include: {
      evidence: { orderBy: { createdAt: "asc" } },
      statusChanges: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
    },
  });
  if (!c) notFound();
  const similar = await prisma.complaint.count({ where: { productKey: c.productKey, id: { not: c.id } } });

  const rows: [string, React.ReactNode][] = [
    ["Product type", PRODUCT_TYPE_LABELS[c.productType]],
    ["Brand", c.brand],
    ["Manufacturer", c.manufacturer],
    ["NAFDAC reg. no.", c.nafdacRegNo ?? <span className="text-slate-400">Not provided</span>],
    ["Batch / lot", c.batchNo],
    ["Expiry date", c.expiryDate && formatDate(c.expiryDate)],
    ["Location", `${c.lga}, ${c.state}`],
    ["Bought at", c.purchaseLocation],
    ["Purchase date", c.purchaseDate && formatDate(c.purchaseDate)],
  ];

  return (
    <div className="space-y-4">
      <Link href="/admin/complaints" className="text-sm text-brand-700 hover:underline">
        ← All complaints
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-slate-500">{c.trackingCode}</p>
          <h1 className="text-2xl font-bold">{c.productName}</h1>
          <p className="text-sm text-slate-500">
            {CATEGORY_LABELS[c.category]} · received {formatDate(c.createdAt, true)}
          </p>
        </div>
        <div className="flex gap-2">
          <SeverityBadge severity={c.severity} />
          <StatusBadge status={c.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{c.description}</p>
          </section>

          {c.healthEffect && (
            <section className="card border-orange-200 bg-orange-50 p-5">
              <h2 className="mb-2 font-semibold text-orange-900">
                Illness reported{c.hospitalized && " – hospital treatment needed"}
              </h2>
              <p className="whitespace-pre-wrap text-sm text-orange-900">{c.healthEffectDetails || "No details given."}</p>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Product details</h2>
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-slate-500">{k}</dt>
                  <dd>{v || <span className="text-slate-400">—</span>}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/admin/products/${encodeURIComponent(c.productKey)}`}
              className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              {similar > 0 ? `${similar} other report(s) about ${describeProductKey(c.productKey)} →` : "View product history →"}
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Evidence ({c.evidence.length})</h2>
            {c.evidence.length === 0 ? (
              <p className="text-sm text-slate-500">No photos attached.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {c.evidence.map((e) => (
                  <a key={e.id} href={`/api/evidence/${e.id}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/evidence/${e.id}`} alt="Evidence photo" className="aspect-square w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Review</h2>
            <StatusForm complaintId={c.id} current={c.status} />
          </section>

          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Reporter contact</h2>
            {c.contactName || c.contactPhone || c.contactEmail ? (
              <dl className="space-y-1 text-sm">
                {c.contactName && <dd>{c.contactName}</dd>}
                {c.contactPhone && (
                  <dd>
                    <a className="text-brand-700 hover:underline" href={`tel:${c.contactPhone}`}>
                      {c.contactPhone}
                    </a>
                  </dd>
                )}
                {c.contactEmail && (
                  <dd>
                    <a className="text-brand-700 hover:underline" href={`mailto:${c.contactEmail}`}>
                      {c.contactEmail}
                    </a>
                  </dd>
                )}
              </dl>
            ) : (
              <p className="text-sm text-slate-500">Anonymous report</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">History</h2>
            <ol className="space-y-3 text-sm">
              {c.statusChanges.map((s) => (
                <li key={s.id} className="border-l-2 border-slate-200 pl-3">
                  <p>
                    {STATUS_LABELS[s.from]} → <strong>{STATUS_LABELS[s.to]}</strong>
                  </p>
                  {s.note && <p className="text-slate-600">{s.note}</p>}
                  <p className="text-xs text-slate-500">
                    {s.admin?.name ?? "Unknown"} · {formatDate(s.createdAt, true)}
                  </p>
                </li>
              ))}
              <li className="border-l-2 border-slate-200 pl-3">
                <p>Report submitted</p>
                <p className="text-xs text-slate-500">{formatDate(c.createdAt, true)}</p>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
