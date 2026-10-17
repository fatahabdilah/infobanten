import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Podcast - infobanten.my.id",
    description: "Podcast Info Banten — obrolan seputar berita dan cerita dari tanah Banten. Segera hadir.",
    path: "/podcast/",
  });
}

export default function PodcastPage() {
  return (
    <div className="px-4 py-10 md:px-5 md:py-16">
      <article className="mx-auto max-w-[960px] bg-white px-6 py-12 text-center md:px-[106px] md:py-[85px]">
        <h1 className="font-heading text-[40px] font-bold leading-[1.2] text-heading md:text-[64px]">Podcast</h1>
        <p className="mx-auto mt-6 max-w-[560px] text-base leading-[25.6px] text-body">
          Podcast Info Banten sedang kami siapkan — obrolan seputar berita, UMKM, pendidikan, dan cerita dari tanah Banten. Nantikan
          episode perdananya!
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-[46px] items-center rounded-[25px] bg-primary px-7 font-bold text-white hover:bg-primary-dark"
        >
          Baca berita terbaru
        </Link>
      </article>
    </div>
  );
}
