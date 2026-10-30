import Link from "next/link";
import { Category, ProductType, Severity, Status } from "@prisma/client";
import { CATEGORY_LABELS, PRODUCT_TYPE_LABELS, SEVERITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { STATES } from "@/lib/nigeria";
import type { ComplaintFilters } from "@/lib/filters";

function Select({ name, value, options, all }: { name: string; value?: string; options: [string, string][]; all: string }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="input py-2 text-sm" aria-label={all}>
      <option value="">{all}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export function ComplaintFiltersForm({ f }: { f: ComplaintFilters }) {
  return (
    <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" action="/admin/complaints">
      <input
        name="q"
        defaultValue={f.q}
        placeholder="Search product, brand, NAFDAC no., batch, code…"
        className="input py-2 text-sm sm:col-span-2"
        aria-label="Search"
      />
      <Select name="category" value={f.category} all="All categories" options={Object.values(Category).map((c) => [c, CATEGORY_LABELS[c]])} />
      <Select name="productType" value={f.productType} all="All product types" options={Object.values(ProductType).map((c) => [c, PRODUCT_TYPE_LABELS[c]])} />
      <Select name="state" value={f.state} all="All states" options={STATES.map((s) => [s, s])} />
      <Select name="status" value={f.status} all="Any status" options={Object.values(Status).map((c) => [c, STATUS_LABELS[c]])} />
      <Select name="severity" value={f.severity} all="Any severity" options={Object.values(Severity).map((c) => [c, SEVERITY_LABELS[c]])} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="health" value="1" defaultChecked={f.health} className="h-4 w-4 accent-brand-600" />
        Only reports of illness
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-slate-500">From</span>
        <input type="date" name="from" defaultValue={f.from} className="input py-2 text-sm" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-slate-500">To</span>
        <input type="date" name="to" defaultValue={f.to} className="input py-2 text-sm" />
      </label>
      {f.productKey && <input type="hidden" name="productKey" value={f.productKey} />}
      <div className="flex items-end gap-2 sm:col-span-2">
        <button className="btn-primary">Apply filters</button>
        <Link href="/admin/complaints" className="btn-secondary">
          Reset
        </Link>
      </div>
    </form>
  );
}
