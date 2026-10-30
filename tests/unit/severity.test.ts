import { describe, expect, it } from "vitest";
import { computeSeverity } from "@/lib/severity";

describe("computeSeverity", () => {
  const base = { category: "OTHER", productType: "OTHER", healthEffect: false, hospitalized: false } as const;

  it("hospitalisation is always critical", () => {
    expect(computeSeverity({ ...base, hospitalized: true, healthEffect: true })).toBe("CRITICAL");
  });
  it("any reported illness is high", () => {
    expect(computeSeverity({ ...base, healthEffect: true })).toBe("HIGH");
  });
  it("fake drugs are high even without illness", () => {
    expect(computeSeverity({ ...base, category: "FAKE_COUNTERFEIT", productType: "DRUG" })).toBe("HIGH");
  });
  it("contaminated food is medium", () => {
    expect(computeSeverity({ ...base, category: "TOXIC_CONTAMINATED", productType: "FOOD" })).toBe("MEDIUM");
  });
  it("mislabeled cosmetic is low", () => {
    expect(computeSeverity({ ...base, category: "MISLABELED", productType: "COSMETIC" })).toBe("LOW");
  });
});
