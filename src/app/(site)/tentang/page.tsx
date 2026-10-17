import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import AboutTemplate from "@/components/site/AboutTemplate";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Tentang - infobanten.my.id",
    description:
      "Info Banten adalah media digital terpercaya yang menyajikan informasi terkini, akurat, dan mendalam seputar Serang, Tangerang, Cilegon, Pandeglang, dan Lebak.",
    path: "/tentang/",
  });
}

export default function TentangPage() {
  return <AboutTemplate />;
}
