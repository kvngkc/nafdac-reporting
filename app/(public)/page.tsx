import Link from "next/link";
import { prisma } from "@/lib/db";
import { countBy, sinceDate } from "@/lib/analytics";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { Category } from "@prisma/client";

export const dynamic = "force-dynamic";

const WHAT_TO_REPORT = [
  { title: "Fake or counterfeit", body: "Products copying a known brand – wrong packaging, taste, colour or effect." },
  { title: "Unregistered", body: "No NAFDAC number, or a number that doesn't match the product." },
  { title: "Expired or tampered", body: "Expired goods, or expiry dates that have been scratched, covered or reprinted." },
  { title: "Toxic or contaminated", body: "Mould, foreign objects, strange smells, or chemicals like bromate or formalin." },
  { title: "Illegal or banned", body: "Codeine syrups, tramadol sold without prescription, banned bleaching creams." },
  { title: "Made someone sick", body: "Any product that caused a bad reaction – these are treated as urgent." },
];

export default async function Home() {
  const [total, last30, byCategory] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { createdAt: { gte: sinceDate(30)! } } }),
    countBy("category", sinceDate(90)),
  ]);
  const max = byCategory[0]?.count ?? 1;

  return (
    <>
      <section className="bg-gradient-to-b from-brand-700 to-brand-600 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Seen a fake, expired or dangerous product?
          </h1>
          <p className="mt-4 max-w-xl text-lg text-brand-50">
            Report it in minutes – no account needed. We group reports by product and location so NAFDAC can find and
            act on dangerous goods faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/report" className="btn bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
              Report a product
            </Link>
            <Link href="/track" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
              Track a report
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4">
        <div className="-mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          <strong>Emergency?</strong> If someone is seriously ill after using a product, go to the nearest hospital or
          call <strong>112</strong> first. Then report the product here.
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-xl font-bold">What you can report</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_TO_REPORT.map((w) => (
            <div key={w.title} className="card p-4">
              <h3 className="font-semibold text-brand-700">{w.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="text-xl font-bold">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["1", "You report", "Tell us the product, what's wrong, where you bought it, and add photos."],
            ["2", "We aggregate", "Reports are grouped by product, NAFDAC number and state to spot patterns and hotspots."],
            ["3", "NAFDAC acts", "Verified trends and urgent cases are compiled into reports for NAFDAC investigators."],
          ].map(([n, t, b]) => (
            <li key={n} className="card flex gap-3 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{n}</span>
              <span>
                <span className="block font-semibold">{t}</span>
                <span className="block text-sm text-slate-600">{b}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="card grid gap-6 p-5 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Total reports</p>
            <p className="text-3xl font-bold">{total.toLocaleString()}</p>
            <p className="mt-3 text-sm text-slate-500">Last 30 days</p>
            <p className="text-2xl font-bold">{last30.toLocaleString()}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-700">Most reported problems (last 90 days)</p>
            {byCategory.length === 0 && <p className="text-sm text-slate-500">No reports yet.</p>}
            <ul className="space-y-2">
              {byCategory.slice(0, 5).map((c) => (
                <li key={c.key} className="text-sm">
                  <div className="flex justify-between">
                    <span>{CATEGORY_LABELS[c.key as Category]}</span>
                    <span className="font-semibold">{c.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(c.count / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
