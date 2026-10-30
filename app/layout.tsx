import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Report Fake & Unsafe Products – NAFDAC Reporting", template: "%s · NAFDAC Reporting" },
  description:
    "Report fake, toxic, expired, illegal or unregistered food and drugs in Nigeria. Complaints are aggregated and sent to NAFDAC.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#008751" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
