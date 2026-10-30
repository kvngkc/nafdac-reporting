import type { Metadata } from "next";
import { ReportForm } from "@/components/report/ReportForm";

export const metadata: Metadata = { title: "Report a product" };

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Report a fake or unsafe product</h1>
      <p className="mb-6 mt-1 text-slate-600">It takes about 3 minutes. You don&apos;t need an account.</p>
      <ReportForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined} />
    </div>
  );
}
