import type { Category, ProductType, Severity } from "@prisma/client";

const DANGEROUS: Category[] = ["TOXIC_CONTAMINATED", "FAKE_COUNTERFEIT", "ILLEGAL_BANNED"];
const INGESTED: ProductType[] = ["DRUG", "FOOD", "WATER_BEVERAGE"];

export function computeSeverity(c: {
  category: Category;
  productType: ProductType;
  healthEffect: boolean;
  hospitalized: boolean;
}): Severity {
  if (c.hospitalized) return "CRITICAL";
  if (c.healthEffect) return "HIGH";
  if (DANGEROUS.includes(c.category) && c.productType === "DRUG") return "HIGH";
  if (DANGEROUS.includes(c.category) || (c.category === "EXPIRED" && INGESTED.includes(c.productType))) return "MEDIUM";
  if (c.category === "UNREGISTERED" && INGESTED.includes(c.productType)) return "MEDIUM";
  return "LOW";
}
