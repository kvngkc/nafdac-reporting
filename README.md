# NAFDAC Consumer Complaint Reporting

A website where Nigerians can report **fake, toxic, expired, illegal or unregistered** food, drugs and other
regulated products. Complaints are aggregated by product, category, location and frequency, and surfaced to
reviewers on a dashboard that flags hotspots for NAFDAC.

## Features

**Public (no account needed)**
- 6-step mobile-first report form: product details (incl. NAFDAC reg. no., batch, expiry), problem category,
  state → LGA (all 36 states + FCT, 774 LGAs), health effects, up to 4 photos, optional contact details
- Tracking code (e.g. `NR-7K3F9Q`) to check status at `/track`
- Landing page with aggregate public stats only (no personal data)
- Spam protection: per-IP rate limit (IPs are salted+hashed, never stored raw) and optional Cloudflare Turnstile
- Photos are decoded and re-encoded server-side, which validates the file type and strips EXIF/GPS metadata

**Staff dashboard (`/admin`)**
- KPIs, complaints per day, breakdowns by category, product type and state
- **Hotspot alerts**: products with ≥5 reports in 7 days, reported in ≥3 states, or linked to illness;
  plus hospitalisation cases awaiting review (thresholds in `lib/config.ts`)
- Most-reported products, grouped by NAFDAC number (or normalised name + brand when no number was given)
- Filterable/searchable complaint list, CSV export of any filtered view, per-product drill-down
- Complaint detail with evidence photos, reporter contact, status workflow
  (Received → Under review → Forwarded to NAFDAC → Resolved / Closed) and an audit trail

Severity is computed automatically: hospitalisation → Critical; any illness or fake/toxic/illegal drug → High.

## Stack

Next.js 15 (App Router) · TypeScript · PostgreSQL + Prisma · Auth.js (credentials, admin-only) · Tailwind CSS ·
Recharts · Zod · sharp · Vitest · Playwright

## Getting started

```bash
cp .env.example .env            # then set AUTH_SECRET and IP_HASH_SALT
docker compose up -d db         # or point DATABASE_URL at any Postgres 14+
npm install
npx prisma migrate dev
SEED_DEMO_DATA=true npx prisma db seed   # admin user + ~240 fictional demo complaints
npm run dev
```

Open http://localhost:3000 for the public site and http://localhost:3000/admin for the dashboard
(default login `admin@example.com` / `ChangeMe123!` — change `SEED_ADMIN_*` before seeding anything real).

## Tests

```bash
npm test                 # unit tests: severity, normalisation, validation, hotspot rules
npm run build && npm run test:e2e   # end-to-end: report → track → admin login → forward → track
```

## Deploying

- Any Node host works (e.g. Vercel + Neon/Supabase Postgres). Run `npx prisma migrate deploy` on release.
- Set `STORAGE_DRIVER=s3` and the `S3_*` variables for photo storage (AWS S3, Cloudflare R2, etc.) — local disk
  storage is for development only.
- Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` to enable the CAPTCHA.
- Never set `SEED_DEMO_DATA=true` in production.

## Project layout

```
app/(public)/          landing, /report (form + server action), /track
app/admin/             login, dashboard, complaints, products
app/api/evidence/      auth-protected photo serving
lib/                   analytics, hotspots, severity, normalisation, storage, rate limiting, validation
prisma/                schema, migrations, seed
tests/                 unit (Vitest) and e2e (Playwright)
```
