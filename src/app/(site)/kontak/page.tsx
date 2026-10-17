import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ContactTemplate from "@/components/site/ContactTemplate";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Kontak - infobanten.my.id",
    description: "Hubungi redaksi Info Banten untuk kirim berita, pasang iklan, kerja sama, atau menjadi penulis tamu.",
    path: "/kontak/",
  });
}

export default function KontakPage() {
  return <ContactTemplate />;
}
