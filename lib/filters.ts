import { Category, Prisma, ProductType, Severity, Status } from "@prisma/client";

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const pick = <T extends string>(v: string | undefined, allowed: Record<string, T>) =>
  v && v in allowed ? (v as T) : undefined;

export function parseComplaintFilters(sp: SearchParams) {
  return {
    q: one(sp.q)?.trim(),
    category: pick(one(sp.category), Category),
    productType: pick(one(sp.productType), ProductType),
    severity: pick(one(sp.severity), Severity),
    status: pick(one(sp.status), Status),
    state: one(sp.state),
    productKey: one(sp.productKey),
    from: one(sp.from),
    to: one(sp.to),
    health: one(sp.health) === "1",
  };
}

export type ComplaintFilters = ReturnType<typeof parseComplaintFilters>;

export function filtersToWhere(f: ComplaintFilters): Prisma.ComplaintWhereInput {
  const where: Prisma.ComplaintWhereInput = {};
  if (f.category) where.category = f.category;
  if (f.productType) where.productType = f.productType;
  if (f.severity) where.severity = f.severity;
  if (f.status) where.status = f.status;
  if (f.state) where.state = f.state;
  if (f.productKey) where.productKey = f.productKey;
  if (f.health) where.healthEffect = true;
  const createdAt: Prisma.DateTimeFilter = {};
  if (f.from && !Number.isNaN(Date.parse(f.from))) createdAt.gte = new Date(f.from);
  if (f.to && !Number.isNaN(Date.parse(f.to))) createdAt.lt = new Date(new Date(f.to).getTime() + 86_400_000);
  if (Object.keys(createdAt).length) where.createdAt = createdAt;
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    where.OR = [
      { productName: contains },
      { brand: contains },
      { manufacturer: contains },
      { nafdacRegNo: contains },
      { batchNo: contains },
      { trackingCode: contains },
      { lga: contains },
      { purchaseLocation: contains },
    ];
  }
  return where;
}

export function filtersToQuery(f: ComplaintFilters, extra: Record<string, string | number | undefined> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...extra })) {
    if (v === undefined || v === false || v === "") continue;
    p.set(k, v === true ? "1" : String(v));
  }
  return p.toString();
}
