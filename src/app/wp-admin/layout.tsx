import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import "./admin.css";

export const metadata: Metadata = {
  title: { template: "%s ‹ infobanten.my.id — WordPress", default: "Dasbor ‹ infobanten.my.id" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="wpa">{children}</div>;
}
