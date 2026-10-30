import { describe, expect, it } from "vitest";
import { detectHotspots, type ProductAggregate } from "@/lib/hotspots";

const agg = (o: Partial<ProductAggregate>): ProductAggregate => ({
  productKey: "k",
  productName: "P",
  brand: null,
  nafdacRegNo: null,
  total: 1,
  recent: 0,
  states: 1,
  health: 0,
  maxSeverity: "LOW",
  lastSeen: new Date(),
  topCategory: "OTHER",
  ...o,
});
const cfg = { minComplaints: 5, windowDays: 7, minStates: 3 };

describe("detectHotspots", () => {
  it("ignores isolated complaints", () => {
    expect(detectHotspots([agg({})], cfg)).toEqual([]);
  });
  it("flags spikes, multi-state spread and illness clusters, ranked by score", () => {
    const alerts = detectHotspots(
      [
        agg({ productKey: "spike", recent: 6, total: 6 }),
        agg({ productKey: "spread", states: 4, total: 4 }),
        agg({ productKey: "ill", health: 2, total: 3, maxSeverity: "CRITICAL" }),
        agg({ productKey: "single-ill", health: 1, total: 1 }),
      ],
      cfg,
    );
    expect(alerts.map((a) => a.productKey).sort()).toEqual(["ill", "spike", "spread"]);
    expect(alerts.find((a) => a.productKey === "spread")!.reasons[0]).toMatch(/4 states/);
    expect(alerts[0].score).toBeGreaterThanOrEqual(alerts[alerts.length - 1].score);
  });
});
