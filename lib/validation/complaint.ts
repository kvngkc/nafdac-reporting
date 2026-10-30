import { z } from "zod";
import { Category, ProductType } from "@prisma/client";
import { isValidStateLga } from "@/lib/nigeria";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const NIGERIAN_PHONE = /^(\+?234|0)[789][01]\d{8}$/;

export const complaintSchema = z
  .object({
    productName: z.string().trim().min(2, "Enter the product name").max(120),
    brand: optionalText(120),
    manufacturer: optionalText(160),
    productType: z.nativeEnum(ProductType, { errorMap: () => ({ message: "Choose a product type" }) }),
    nafdacRegNo: optionalText(30),
    batchNo: optionalText(40),
    expiryDate: optionalDate,
    category: z.nativeEnum(Category, { errorMap: () => ({ message: "Choose what is wrong" }) }),
    description: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)").max(3000),
    state: z.string().min(1, "Choose a state"),
    lga: z.string().min(1, "Choose an LGA"),
    purchaseLocation: optionalText(200),
    purchaseDate: optionalDate,
    healthEffect: checkbox,
    healthEffectDetails: optionalText(2000),
    hospitalized: checkbox,
    contactName: optionalText(100),
    contactPhone: optionalText(20).refine(
      (v) => !v || NIGERIAN_PHONE.test(v.replace(/[\s-]/g, "")),
      "Enter a valid Nigerian phone number, e.g. 08031234567",
    ),
    contactEmail: optionalText(160).refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email"),
  })
  .superRefine((v, ctx) => {
    if (!isValidStateLga(v.state, v.lga)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lga"], message: "Choose an LGA in the selected state" });
    }
    if (v.purchaseDate && v.purchaseDate > new Date()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["purchaseDate"], message: "Date can't be in the future" });
    }
  })
  .transform((v) => ({ ...v, healthEffect: v.healthEffect || v.hospitalized }));

export type ComplaintInput = z.infer<typeof complaintSchema>;

export const STATUS_UPDATE = z.object({
  complaintId: z.string().min(1),
  status: z.enum(["NEW", "UNDER_REVIEW", "FORWARDED", "RESOLVED", "DISMISSED"]),
  note: optionalText(1000),
});
