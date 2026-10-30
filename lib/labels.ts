import type { Category, ProductType, Severity, Status } from "@prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  FAKE_COUNTERFEIT: "Fake / counterfeit",
  UNREGISTERED: "Not NAFDAC registered",
  EXPIRED: "Expired or tampered expiry date",
  TOXIC_CONTAMINATED: "Toxic / contaminated",
  ILLEGAL_BANNED: "Illegal or banned substance",
  MISLABELED: "Wrong or misleading label",
  OTHER: "Other",
};

export const CATEGORY_HINTS: Record<Category, string> = {
  FAKE_COUNTERFEIT: "Looks like a known brand but packaging, taste or effect is wrong",
  UNREGISTERED: "No NAFDAC number, or the number is invalid",
  EXPIRED: "Past expiry, or the date has been changed or covered",
  TOXIC_CONTAMINATED: "Has foreign objects, bad smell, mould or chemical contamination",
  ILLEGAL_BANNED: "Product contains a banned ingredient, e.g. codeine syrup, bromate, sniper misuse",
  MISLABELED: "Ingredients, dosage or claims on the label are false or missing",
  OTHER: "Something else that should concern NAFDAC",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  FOOD: "Food",
  DRUG: "Drug / medicine",
  COSMETIC: "Cosmetic / skin care",
  WATER_BEVERAGE: "Water / beverage",
  MEDICAL_DEVICE: "Medical device",
  CHEMICAL: "Chemical / agro-chemical",
  OTHER: "Other",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const STATUS_LABELS: Record<Status, string> = {
  NEW: "Received",
  UNDER_REVIEW: "Under review",
  FORWARDED: "Forwarded to NAFDAC",
  RESOLVED: "Resolved",
  DISMISSED: "Closed – no action",
};
