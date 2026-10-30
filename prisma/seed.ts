import { PrismaClient, type Category, type ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STATES, STATES_LGAS } from "../lib/nigeria";
import { normalizeRegNo, normalizeText, productKey } from "../lib/normalize";
import { computeSeverity } from "../lib/severity";
import { generateTrackingCode } from "../lib/tracking";

const prisma = new PrismaClient();

// Fictional products/brands for demo data only.
const PRODUCTS: {
  name: string;
  brand: string;
  type: ProductType;
  reg?: string;
  categories: Category[];
  weight: number;
  states?: string[];
}[] = [
  { name: "Paracetamol 500mg tablets", brand: "Demo Pharma", type: "DRUG", reg: "A4-0001", categories: ["FAKE_COUNTERFEIT", "MISLABELED"], weight: 9, states: ["Lagos", "Ogun", "Oyo", "Kano"] },
  { name: "Artemether/Lumefantrine tablets", brand: "MalaCure (demo)", type: "DRUG", reg: "B4-2231", categories: ["FAKE_COUNTERFEIT"], weight: 8, states: ["Anambra", "Lagos", "Enugu", "Abia", "Imo"] },
  { name: "Codeine cough syrup", brand: "Unbranded", type: "DRUG", categories: ["ILLEGAL_BANNED", "UNREGISTERED"], weight: 6, states: ["Kano", "Kaduna", "Katsina"] },
  { name: "Vegetable oil 1L", brand: "Golden Drop (demo)", type: "FOOD", reg: "01-4421", categories: ["TOXIC_CONTAMINATED", "EXPIRED"], weight: 5 },
  { name: "Sachet water", brand: "Crystal Spring (demo)", type: "WATER_BEVERAGE", categories: ["UNREGISTERED", "TOXIC_CONTAMINATED"], weight: 7, states: ["Lagos", "Rivers", "FCT"] },
  { name: "Tomato paste 70g", brand: "RedSun (demo)", type: "FOOD", reg: "A1-7781", categories: ["EXPIRED", "MISLABELED"], weight: 4 },
  { name: "Skin lightening cream", brand: "Glow Max (demo)", type: "COSMETIC", categories: ["ILLEGAL_BANNED", "UNREGISTERED"], weight: 5, states: ["Lagos", "FCT", "Rivers", "Delta"] },
  { name: "Infant formula 400g", brand: "BabyStart (demo)", type: "FOOD", reg: "A1-9902", categories: ["FAKE_COUNTERFEIT", "EXPIRED"], weight: 3 },
  { name: "Ampicillin/Cloxacillin capsules", brand: "Ampiclox-D (demo)", type: "DRUG", reg: "04-1188", categories: ["FAKE_COUNTERFEIT", "EXPIRED"], weight: 4 },
  { name: "Energy drink 250ml", brand: "Volt Up (demo)", type: "WATER_BEVERAGE", reg: "A8-3001", categories: ["MISLABELED", "EXPIRED"], weight: 3 },
  { name: "Bread", brand: "Daily Loaf (demo)", type: "FOOD", categories: ["TOXIC_CONTAMINATED", "UNREGISTERED"], weight: 3, states: ["Oyo", "Osun", "Ogun"] },
  { name: "Insecticide spray", brand: "KillAll (demo)", type: "CHEMICAL", categories: ["UNREGISTERED", "MISLABELED"], weight: 2 },
  { name: "Herbal bitters", brand: "Roots Power (demo)", type: "DRUG", categories: ["UNREGISTERED", "MISLABELED", "OTHER"], weight: 3 },
  { name: "Blood glucose test strips", brand: "SugarCheck (demo)", type: "MEDICAL_DEVICE", reg: "D9-0042", categories: ["FAKE_COUNTERFEIT", "EXPIRED"], weight: 2 },
];

const DESCRIPTIONS: Record<Category, string[]> = {
  FAKE_COUNTERFEIT: [
    "The packaging looks different from the original – the print is blurry and the colour is off.",
    "Tablets crumble easily and taste different from what I usually buy. Had no effect at all.",
    "Hologram sticker missing and the NAFDAC number doesn't verify via the MAS code.",
  ],
  UNREGISTERED: [
    "There is no NAFDAC number anywhere on the pack.",
    "The NAFDAC number printed on it belongs to a different product.",
    "Sold in plain packaging with only a handwritten label.",
  ],
  EXPIRED: [
    "The expiry date has been scratched off and a new date printed over it.",
    "Product expired two months ago but was still on the shelf.",
  ],
  TOXIC_CONTAMINATED: [
    "Strong chemical smell when I opened it, and there were black particles inside.",
    "Found mould and a foreign object in the product.",
    "Water has a strange taste and leaves residue when boiled.",
  ],
  ILLEGAL_BANNED: [
    "Being sold openly to young people without any prescription.",
    "Label lists mercury/hydroquinone at a high concentration.",
  ],
  MISLABELED: [
    "Label claims 500mg but the box and the leaflet say different strengths.",
    "Ingredients list is missing and the manufacturer address is fake.",
  ],
  OTHER: ["Product caused concern; seller refused to give receipt."],
};

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const chance = (p: number) => Math.random() < p;

function weightedProduct() {
  const total = PRODUCTS.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRODUCTS) if ((r -= p.weight) <= 0) return p;
  return PRODUCTS[0];
}

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, name: "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Admin user: ${email}`);

  if (process.env.SEED_DEMO_DATA !== "true") {
    console.log("Skipping demo complaints (set SEED_DEMO_DATA=true to add them).");
    return;
  }
  if ((await prisma.complaint.count()) > 0) {
    console.log("Complaints already exist; not adding demo data.");
    return;
  }

  const N = 240;
  const now = Date.now();
  for (let i = 0; i < N; i++) {
    const p = weightedProduct();
    // Skew recent: ~35% in the last 2 weeks, so hotspot rules have something to find.
    const daysAgo = chance(0.35) ? Math.random() * 14 : Math.random() * 180;
    const createdAt = new Date(now - daysAgo * 86_400_000);
    const state = p.states && chance(0.8) ? rand(p.states) : rand(STATES);
    const lga = rand(STATES_LGAS[state]);
    const category = rand(p.categories);
    const healthEffect = chance(p.type === "DRUG" || p.type === "FOOD" || p.type === "WATER_BEVERAGE" ? 0.18 : 0.06);
    const hospitalized = healthEffect && chance(0.25);
    const reg = p.reg && chance(0.85) ? p.reg : undefined;
    const statusRoll = daysAgo > 30 ? rand(["FORWARDED", "RESOLVED", "DISMISSED", "UNDER_REVIEW"] as const) : chance(0.7) ? "NEW" : "UNDER_REVIEW";
    await prisma.complaint.create({
      data: {
        trackingCode: generateTrackingCode(),
        category,
        productType: p.type,
        productName: p.name,
        productNameNormalized: normalizeText(p.name),
        productKey: productKey({ productName: p.name, brand: p.brand, nafdacRegNo: reg }),
        brand: p.brand,
        nafdacRegNo: normalizeRegNo(reg),
        batchNo: chance(0.6) ? `B${Math.floor(1000 + Math.random() * 9000)}` : null,
        state,
        lga,
        purchaseLocation: chance(0.6) ? rand(["Open market", "Roadside kiosk", "Pharmacy", "Supermarket", "Hawker", "Patent medicine store"]) : null,
        purchaseDate: chance(0.5) ? new Date(createdAt.getTime() - Math.random() * 10 * 86_400_000) : null,
        description: rand(DESCRIPTIONS[category]),
        healthEffect,
        healthEffectDetails: healthEffect ? rand(["Vomiting and stomach pain within hours.", "Skin rash and burning.", "Dizziness and severe headache.", "Child developed diarrhoea."]) : null,
        hospitalized,
        severity: computeSeverity({ category, productType: p.type, healthEffect, hospitalized }),
        status: statusRoll,
        contactPhone: chance(0.4) ? `080${Math.floor(10000000 + Math.random() * 89999999)}` : null,
        createdAt,
      },
    });
  }
  console.log(`Inserted ${N} demo complaints.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
