import "server-only";
import { Prisma, type Severity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HOTSPOT } from "@/lib/config";
import { detectHotspots, type ProductAggregate } from "@/lib/hotspots";

const DAY = 86_400_000;

export function sinceDate(days: number | null): Date | null {
  return days ? new Date(Date.now() - days * DAY) : null;
}

const whereSince = (since: Date | null): Prisma.ComplaintWhereInput => (since ? { createdAt: { gte: since } } : {});

export async function getKpis(since: Date | null) {
  const where = whereSince(since);
  const [total, last7, last30, health, critical, open] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.count({ where: { createdAt: { gte: sinceDate(7)! } } }),
    prisma.complaint.count({ where: { createdAt: { gte: sinceDate(30)! } } }),
    prisma.complaint.count({ where: { ...where, healthEffect: true } }),
    prisma.complaint.count({ where: { ...where, severity: "CRITICAL" } }),
    prisma.complaint.count({ where: { ...where, status: { in: ["NEW", "UNDER_REVIEW"] } } }),
  ]);
  return { total, last7, last30, health, critical, open };
}

export async function countBy<K extends "category" | "productType" | "state" | "status" | "severity">(
  field: K,
  since: Date | null,
  extraWhere: Prisma.ComplaintWhereInput = {},
) {
  // Prisma's groupBy generics don't resolve with a generic `by` field, so narrow the result type here.
  const rows = (await prisma.complaint.groupBy({
    by: [field as Prisma.ComplaintScalarFieldEnum],
    where: { ...whereSince(since), ...extraWhere },
    _count: { _all: true },
  })) as unknown as (Record<K, string> & { _count: { _all: number } })[];
  return rows
    .map((r) => ({ key: String(r[field]), count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

/** Daily complaint counts (zero-filled) for the last `days` days. */
export async function dailySeries(days: number, productKey?: string) {
  const since = new Date(Date.now() - (days - 1) * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*)::bigint AS count
    FROM "Complaint"
    WHERE "createdAt" >= ${since}
    ${productKey ? Prisma.sql`AND "productKey" = ${productKey}` : Prisma.empty}
    GROUP BY 1 ORDER BY 1`;
  const map = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    return { date: d, count: map.get(d) ?? 0 };
  });
}

type ProductRow = {
  productKey: string;
  productName: string;
  brand: string | null;
  nafdacRegNo: string | null;
  total: bigint;
  recent: bigint;
  states: bigint;
  health: bigint;
  maxSeverity: Severity;
  lastSeen: Date;
  topCategory: string;
};

export async function productAggregates(since: Date | null, limit = 20): Promise<ProductAggregate[]> {
  const recentSince = sinceDate(HOTSPOT.windowDays)!;
  const rows = await prisma.$queryRaw<ProductRow[]>`
    SELECT
      "productKey",
      MODE() WITHIN GROUP (ORDER BY "productName") AS "productName",
      MODE() WITHIN GROUP (ORDER BY "brand") AS "brand",
      MAX("nafdacRegNo") AS "nafdacRegNo",
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE "createdAt" >= ${recentSince})::bigint AS recent,
      COUNT(DISTINCT "state")::bigint AS states,
      COUNT(*) FILTER (WHERE "healthEffect")::bigint AS health,
      MAX("severity") AS "maxSeverity",
      MAX("createdAt") AS "lastSeen",
      MODE() WITHIN GROUP (ORDER BY "category")::text AS "topCategory"
    FROM "Complaint"
    ${since ? Prisma.sql`WHERE "createdAt" >= ${since}` : Prisma.empty}
    GROUP BY "productKey"
    ORDER BY total DESC, "lastSeen" DESC
    LIMIT ${limit}`;
  return rows.map((r) => ({
    ...r,
    total: Number(r.total),
    recent: Number(r.recent),
    states: Number(r.states),
    health: Number(r.health),
  }));
}

export async function getHotspots() {
  // Look at the last 30 days of activity for multi-state spread; recent spikes use HOTSPOT.windowDays.
  const products = await productAggregates(sinceDate(30), 200);
  const productAlerts = detectHotspots(products);
  const critical = await prisma.complaint.findMany({
    where: { severity: "CRITICAL", createdAt: { gte: sinceDate(30)! }, status: { in: ["NEW", "UNDER_REVIEW"] } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, trackingCode: true, productName: true, state: true, lga: true, createdAt: true },
  });
  return { productAlerts, critical };
}
