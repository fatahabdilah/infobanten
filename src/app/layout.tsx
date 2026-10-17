import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["300", "400", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Info Banten",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0274be",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${sora.variable}`}>{children}</body>
    </html>
  );
}
