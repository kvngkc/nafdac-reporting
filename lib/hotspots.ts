import type { Severity } from "@prisma/client";
import { HOTSPOT } from "@/lib/config";

export type ProductAggregate = {
  productKey: string;
  productName: string;
  brand: string | null;
  nafdacRegNo: string | null;
  total: number;
  /** Complaints within HOTSPOT.windowDays. */
  recent: number;
  states: number;
  health: number;
  maxSeverity: Severity;
  lastSeen: Date;
  topCategory: string;
};

export type HotspotAlert = ProductAggregate & { reasons: string[]; score: number };

const SEVERITY_WEIGHT: Record<Severity, number> = { LOW: 0, MEDIUM: 1, HIGH: 3, CRITICAL: 5 };

/** Pure function so the flagging rules are unit-testable without a database. */
export function detectHotspots(products: ProductAggregate[], cfg = HOTSPOT): HotspotAlert[] {
  const alerts: HotspotAlert[] = [];
  for (const p of products) {
    const reasons: string[] = [];
    if (p.recent >= cfg.minComplaints) reasons.push(`${p.recent} complaints in the last ${cfg.windowDays} days`);
    if (p.states >= cfg.minStates) reasons.push(`Reported in ${p.states} states`);
    if (p.health > 0 && p.total >= 2) reasons.push(`${p.health} report(s) of people falling ill`);
    if (!reasons.length) continue;
    const score = p.recent * 2 + p.states * 3 + p.health * 4 + SEVERITY_WEIGHT[p.maxSeverity];
    alerts.push({ ...p, reasons, score });
  }
  return alerts.sort((a, b) => b.score - a.score);
}
