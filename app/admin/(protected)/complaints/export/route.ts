import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { filtersToWhere, parseComplaintFilters } from "@/lib/filters";
import { CATEGORY_LABELS, PRODUCT_TYPE_LABELS, SEVERITY_LABELS, STATUS_LABELS } from "@/lib/labels";

const csvCell = (v: unknown) => {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const f = parseComplaintFilters(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await prisma.complaint.findMany({ where: filtersToWhere(f), orderBy: { createdAt: "desc" }, take: 50_000 });

  const header = [
    "Tracking code", "Received", "Product", "Brand", "Manufacturer", "Product type", "NAFDAC reg no", "Batch no",
    "Expiry date", "Category", "Description", "State", "LGA", "Purchase location", "Purchase date",
    "Illness reported", "Illness details", "Hospitalised", "Severity", "Status", "Contact name", "Contact phone", "Contact email",
  ];
  const lines = rows.map((c) =>
    [
      c.trackingCode, c.createdAt, c.productName, c.brand, c.manufacturer, PRODUCT_TYPE_LABELS[c.productType], c.nafdacRegNo,
      c.batchNo, c.expiryDate?.toISOString().slice(0, 10), CATEGORY_LABELS[c.category], c.description, c.state, c.lga,
      c.purchaseLocation, c.purchaseDate?.toISOString().slice(0, 10), c.healthEffect ? "Yes" : "No", c.healthEffectDetails,
      c.hospitalized ? "Yes" : "No", SEVERITY_LABELS[c.severity], STATUS_LABELS[c.status], c.contactName, c.contactPhone, c.contactEmail,
    ].map(csvCell).join(","),
  );
  const body = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="complaints-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
