import type { Metadata } from "next";
import { getPosts, getPostsInCategory } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { getOptions, whatsappLink } from "@/lib/site";
import AdBanner from "@/components/site/AdBanner";
import {
  DisasterSection,
  FeaturedSection,
  GridSection,
  HomeHero,
  OverlaySection,
  SplitSection,
  WebsiteBanner,
} from "@/components/site/HomeSections";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getOptions();
  return pageMetadata({
    title: `Beranda - ${site.blogname}`,
    description: site.blogdescription,
    path: "/",
    image: { url: "/images/og-default.jpg", width: 1200, height: 630, type: "image/jpeg" },
  });
}

/** Beranda di-cache (ISR) dan diperbarui otomatis saat konten diubah dari admin.
 *  /?s= (pencarian) dan /?p= (tautan lama) dialihkan ke route lain lewat rewrite di next.config. */
export default async function HomePage() {
  const [latest, featured, disaster, sport, politics, economy, education, travel, culinary, site] = await Promise.all([
    getPosts({ take: 4, excerptWords: 20, withTotal: false }).then((r) => r.posts),
    getPostsInCategory("berita-pilihan", 3),
    getPostsInCategory("tanggap-bencana", 2),
    getPostsInCategory("olahraga", 2, 20),
    getPostsInCategory("politik", 3),
    getPostsInCategory("ekonomi", 2, 10),
    getPostsInCategory("pendidikan", 2, 10),
    getPostsInCategory("wisata", 2, 20),
    getPostsInCategory("kuliner", 3),
    getOptions(),
  ]);

  return (
    <>
      <HomeHero main={latest[0]} side={latest.slice(1, 4)} />
      {featured.length > 0 && <FeaturedSection posts={featured} />}
      {disaster.length > 0 && <DisasterSection posts={disaster} />}
      <AdBanner />
      <OverlaySection title="Olahraga" slug="olahraga" linkLabel="Lihat Semua" posts={sport} />
      <div className="pt-4">
        <GridSection title="Politik" slug="politik" posts={politics} />
        <div className="pt-[100px]" />
        <SplitSection
          blocks={[
            { title: "Ekonomi", slug: "ekonomi", posts: economy },
            { title: "Pendidikan", slug: "pendidikan", posts: education },
          ]}
        />
        <WebsiteBanner href={whatsappLink(site.contactWhatsapp, "Halo Admin Info Banten, saya tertarik dengan jasa pembuatan website.")} />
        <OverlaySection title="Wisata" slug="wisata" linkLabel="Selengkapnya di Wisata" posts={travel} size="md" />
        <GridSection title="Kuliner" slug="kuliner" posts={culinary} />
        <div className="pb-11" />
      </div>
    </>
  );
}
