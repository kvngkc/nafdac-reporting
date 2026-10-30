import { describe, expect, it } from "vitest";
import { complaintSchema } from "@/lib/validation/complaint";

const valid = {
  productName: "Paracetamol 500mg",
  productType: "DRUG",
  category: "FAKE_COUNTERFEIT",
  description: "The tablets crumble and have no effect.",
  state: "Lagos",
  lga: "Ikeja",
};

describe("complaintSchema", () => {
  it("accepts a minimal valid complaint", () => {
    expect(complaintSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects an LGA from another state", () => {
    const r = complaintSchema.safeParse({ ...valid, lga: "Nsukka" });
    expect(r.success).toBe(false);
    expect(r.error?.flatten().fieldErrors.lga).toBeDefined();
  });
  it("validates Nigerian phone numbers", () => {
    expect(complaintSchema.safeParse({ ...valid, contactPhone: "0803 123 4567" }).success).toBe(true);
    expect(complaintSchema.safeParse({ ...valid, contactPhone: "+2348031234567" }).success).toBe(true);
    expect(complaintSchema.safeParse({ ...valid, contactPhone: "12345" }).success).toBe(false);
  });
  it("treats hospitalisation as a health effect", () => {
    const r = complaintSchema.parse({ ...valid, hospitalized: "on" });
    expect(r.healthEffect).toBe(true);
  });
  it("rejects future purchase dates", () => {
    expect(complaintSchema.safeParse({ ...valid, purchaseDate: "2999-01-01" }).success).toBe(false);
  });
});
