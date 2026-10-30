import { describe, expect, it } from "vitest";
import { describeProductKey, normalizeRegNo, normalizeText, productKey } from "@/lib/normalize";
import { normalizeTrackingCode } from "@/lib/tracking";

describe("normalisation", () => {
  it("normalises product names for grouping", () => {
    expect(normalizeText("  Paracetamol-500mg  TABLETS!! ")).toBe("paracetamol 500mg tablets");
  });
  it("normalises NAFDAC numbers regardless of formatting", () => {
    expect(normalizeRegNo("a4-1234")).toBe("A41234");
    expect(normalizeRegNo("A4 1234")).toBe("A41234");
    expect(normalizeRegNo("  ")).toBeNull();
  });
  it("groups by reg number when present, otherwise name + brand", () => {
    expect(productKey({ productName: "X", nafdacRegNo: "A4-1234" })).toBe(productKey({ productName: "Y", nafdacRegNo: "a4 1234" }));
    expect(productKey({ productName: "Sachet Water", brand: "Crystal" })).toBe("name:sachet water|crystal");
    expect(describeProductKey("reg:A41234")).toBe("NAFDAC No. A41234");
  });
  it("accepts tracking codes typed loosely", () => {
    expect(normalizeTrackingCode("nr-abc234")).toBe("NR-ABC234");
    expect(normalizeTrackingCode("abc234")).toBe("NR-ABC234");
  });
});
