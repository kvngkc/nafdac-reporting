import { expect, test } from "@playwright/test";
import sharp from "sharp";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

test("citizen reports a product, admin forwards it, citizen sees the update", async ({ page }) => {
  const productName = `E2E Test Syrup ${Date.now()}`;
  const photo = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#c00" } }).jpeg().toBuffer();

  // --- Citizen submits a report ---
  await page.goto("/report");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Enter the product name")).toBeVisible();

  await page.getByLabel("Product name").fill(productName);
  await page.getByLabel("Type of product").selectOption("DRUG");
  await page.getByLabel("NAFDAC Reg. No.").fill("Z9-9999");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByText("Fake / counterfeit").click();
  await page.getByLabel("Describe the problem").fill("Packaging is different and the syrup smells odd.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("State").selectOption("Lagos");
  await page.getByLabel("Local Government Area").selectOption("Ikeja");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel(/Yes – someone had a bad reaction/).check();
  await page.getByLabel("What happened?").fill("Vomiting after first dose.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.locator('input[type="file"]').setInputFiles({ name: "label.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.getByRole("button", { name: "Remove label.jpg" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Phone number").fill("08031234567");
  await page.getByRole("button", { name: "Submit report" }).click();

  const codeEl = page.getByTestId("tracking-code");
  await expect(codeEl).toBeVisible({ timeout: 20_000 });
  const code = (await codeEl.textContent())!.trim();
  expect(code).toMatch(/^NR-[A-Z0-9]{6}$/);

  // --- Public tracking shows "received" ---
  await page.goto(`/track?code=${code.toLowerCase()}`);
  await expect(page.getByTestId("track-status")).toContainText("waiting to be reviewed");

  // --- Admin area requires login ---
  await page.goto("/admin/complaints");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  await page.goto(`/admin/complaints?q=${encodeURIComponent(code)}`);
  await page.getByRole("link", { name: productName }).click();
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
  await expect(page.getByText("08031234567")).toBeVisible();
  await expect(page.getByText("Evidence (1)")).toBeVisible();
  // Uploaded image is served (re-encoded) to the admin.
  const img = page.getByAltText("Evidence photo");
  await expect(img).toHaveJSProperty("complete", true);
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(64);

  await page.getByLabel("Status").selectOption("FORWARDED");
  await page.getByLabel(/Note/).fill("Included in weekly NAFDAC report");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Included in weekly NAFDAC report")).toBeVisible();

  // --- Citizen sees the new status ---
  await page.goto(`/track?code=${code}`);
  await expect(page.getByTestId("track-status")).toContainText("forwarded to NAFDAC");
});

test("evidence and export endpoints reject anonymous users", async ({ request }) => {
  expect((await request.get("/admin/complaints/export", { maxRedirects: 0 })).status()).not.toBe(200);
  expect((await request.get("/api/evidence/anything", { maxRedirects: 0 })).status()).not.toBe(200);
});
