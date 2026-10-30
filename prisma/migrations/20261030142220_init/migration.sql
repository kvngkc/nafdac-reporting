-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('FAKE_COUNTERFEIT', 'UNREGISTERED', 'EXPIRED', 'TOXIC_CONTAMINATED', 'ILLEGAL_BANNED', 'MISLABELED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('FOOD', 'DRUG', 'COSMETIC', 'WATER_BEVERAGE', 'MEDICAL_DEVICE', 'CHEMICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('NEW', 'UNDER_REVIEW', 'FORWARDED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'ANALYST');

-- CreateTable
CREATE TABLE "public"."Complaint" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "category" "public"."Category" NOT NULL,
    "productType" "public"."ProductType" NOT NULL,
    "productName" TEXT NOT NULL,
    "productNameNormalized" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "brand" TEXT,
    "manufacturer" TEXT,
    "nafdacRegNo" TEXT,
    "batchNo" TEXT,
    "expiryDate" TIMESTAMP(3),
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "purchaseLocation" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "healthEffect" BOOLEAN NOT NULL DEFAULT false,
    "healthEffectDetails" TEXT,
    "hospitalized" BOOLEAN NOT NULL DEFAULT false,
    "severity" "public"."Severity" NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'NEW',
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evidence" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'ANALYST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StatusChange" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "from" "public"."Status" NOT NULL,
    "to" "public"."Status" NOT NULL,
    "note" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateLimit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_trackingCode_key" ON "public"."Complaint"("trackingCode");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "public"."Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "public"."Complaint"("category");

-- CreateIndex
CREATE INDEX "Complaint_productType_idx" ON "public"."Complaint"("productType");

-- CreateIndex
CREATE INDEX "Complaint_state_idx" ON "public"."Complaint"("state");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "public"."Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_severity_idx" ON "public"."Complaint"("severity");

-- CreateIndex
CREATE INDEX "Complaint_productKey_createdAt_idx" ON "public"."Complaint"("productKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "public"."AdminUser"("email");

-- CreateIndex
CREATE INDEX "StatusChange_complaintId_idx" ON "public"."StatusChange"("complaintId");

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StatusChange" ADD CONSTRAINT "StatusChange_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StatusChange" ADD CONSTRAINT "StatusChange_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
