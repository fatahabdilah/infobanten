/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { categoryUrl, type PostCard } from "@/lib/posts";
import { OverlayCard, SectionHeader, StackedCard } from "./Cards";
import SubscribeForm from "./SubscribeForm";

/** Hero beranda (Figma 192:4546) */
export function HomeHero({ main, side }: { main?: PostCard; side: PostCard[] }) {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-[100px] md:px-10 md:pb-0 md:pt-[110px]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img src="/images/hero-bg.png" alt="" className="absolute left-0 top-0 h-[97%] w-full max-w-none" />
        <img src="/images/hero-overlay.png" alt="" className="absolute left-[33.59%] top-0 h-full w-[66.41%] max-w-none opacity-50" />
      </div>
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-6 lg:flex-row lg:gap-0">
        {main && (
          <div className="lg:w-[900px] lg:p-2.5">
            <article className="group relative min-h-[520px] overflow-hidden bg-heading md:min-h-[640px] lg:h-[838px]">
              {main.imageLarge && (
                <img
                  src={main.imageLarge}
                  alt={main.imageAlt}
                  fetchPriority="high"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-[rgba(10,9,12,0.47)]" />
              <div className="absolute inset-x-6 bottom-8 md:left-[50px] md:right-auto md:w-[590px] lg:bottom-auto lg:top-[320px]">
                {main.categories[0] && (
                  <Link
                    href={categoryUrl(main.categories[0].slug)}
                    className="relative z-10 text-sm font-medium uppercase leading-[21px] text-white hover:underline"
                  >
                    {main.categories.map((c) => c.name).join(", ")}
                  </Link>
                )}
                <h1 className="mt-1.5 line-clamp-[8] pb-2.5 font-heading text-2xl font-bold leading-[1.2] text-white md:text-[32px] md:leading-[38.4px]">
                  <Link href={main.url} className="after:absolute after:inset-0">
                    {main.title}
                  </Link>
                </h1>
                <p className="text-sm font-medium uppercase leading-[21px] text-white">
                  {main.author} <span className="px-1.5">·</span> {formatDate(main.date)} <span className="px-1.5">·</span>{" "}
                  {main.commentCount ? `${main.commentCount} komentar` : "Tidak ada komentar"}
                </p>
                <p className="mt-3 line-clamp-3 text-base leading-[25.6px] text-white">{main.excerpt}</p>
              </div>
            </article>
          </div>
        )}
        <div className="lg:w-[300px] lg:py-2.5 lg:pl-5 lg:pr-2.5">
          <ul className="grid gap-[15px] sm:grid-cols-3 lg:grid-cols-1">
            {side.map((p) => (
              <li key={p.id}>
                <p className="truncate pt-[5px] text-xs font-semibold uppercase leading-[23px] tracking-[3px] text-primary">
                  {p.categories.map((c) => c.name).join(", ") || "Berita"}
                </p>
                <h2 className="mt-[5px] line-clamp-5 font-heading text-base font-bold leading-5 text-heading">
                  <Link href={p.url} className="hover:text-primary">
                    {p.title}
                  </Link>
                </h2>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Berita Pilihan + widget langganan (Figma 192:4703) */
export function FeaturedSection({ posts }: { posts: PostCard[] }) {
  return (
    <section className="px-4 pt-14 md:px-10 md:pt-20">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 lg:flex-row">
        <div className="border-b border-line pb-10 pt-2.5 lg:w-[832px] lg:shrink-0 lg:pl-2.5 lg:mr-12">
          <SectionHeader title="Berita Pilihan" href={categoryUrl("berita-pilihan")} linkLabel="Lihat Semua" size="sm" />
          <div className="grid gap-5 px-2.5 pt-5 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((p) => (
              <StackedCard key={p.id} post={p} pills="solid" showMeta={false} showExcerpt={false} imageGap="pb-5" />
            ))}
          </div>
        </div>
        <aside className="flex items-center border border-line p-5 lg:w-[300px] lg:shrink-0">
          <div className="w-full">
            <div className="flex size-11 items-center justify-center bg-primary p-2.5">
              <img src="/images/icon-mail.svg" alt="" width={24} height={24} />
            </div>
            <h2 className="mt-10 font-heading text-xl font-bold leading-6 text-heading">Langganan Berita Terbaru</h2>
            <p className="mt-2.5 text-base leading-[25.6px] text-body">
              Dapatkan update berita terpercaya dan peristiwa penting di seputar Banten langsung di email Anda setiap hari.
            </p>
            <div className="mt-2">
              <SubscribeForm variant="widget" />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/** Tanggap Bencana + iklan samping (Figma 192:4753) */
export function DisasterSection({ posts }: { posts: PostCard[] }) {
  return (
    <section className="px-4 pb-12 pt-16 md:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 lg:flex-row">
        <div className="py-2.5 lg:w-[880px] lg:shrink-0 lg:pl-2.5 lg:pr-12">
          <SectionHeader title="Tanggap Bencana" href={categoryUrl("tanggap-bencana")} linkLabel="Selengkapnya di Tanggap Bencana" size="lg" />
          <div className="grid gap-[30px] pt-5 sm:grid-cols-2">
            {posts.map((p) => (
              <StackedCard key={p.id} post={p} pills="light" imageGap="pb-6" />
            ))}
          </div>
        </div>
        <div className="flex justify-center p-2.5 lg:w-[300px]">
          <img src="/images/ad-sidebar.png" alt="Iklan" width={280} height={560} loading="lazy" className="h-[560px] w-[280px] object-cover" />
        </div>
      </div>
    </section>
  );
}

/** Dua kartu overlay lebar (Olahraga, Wisata) */
export function OverlaySection({
  title,
  slug,
  linkLabel,
  posts,
  size = "lg",
}: {
  title: string;
  slug: string;
  linkLabel: string;
  posts: PostCard[];
  size?: "md" | "lg";
}) {
  if (!posts.length) return null;
  return (
    <section className="px-4 pb-6 pt-10 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader title={title} href={categoryUrl(slug)} linkLabel={linkLabel} size={size} />
        <div className="grid px-2.5 pb-[26px] pt-5 md:grid-cols-2">
          {posts.map((p) => (
            <OverlayCard key={p.id} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Grid kartu bertumpuk per kategori (Politik, Kuliner) */
export function GridSection({
  title,
  slug,
  posts,
  columns = 3,
}: {
  title: string;
  slug: string;
  posts: PostCard[];
  columns?: 2 | 3;
}) {
  if (!posts.length) return null;
  return (
    <section className="px-4 md:px-10">
      <div className="mx-auto max-w-[1200px] border-b border-line px-2.5 pb-6 pt-12">
        <SectionHeader title={title} href={categoryUrl(slug)} linkLabel={`Selengkapnya di ${title}`} />
        <div className={`grid gap-x-[30px] gap-y-10 pt-5 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
          {posts.map((p) => (
            <StackedCard key={p.id} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Dua kategori berdampingan (Ekonomi | Pendidikan) */
export function SplitSection({ blocks }: { blocks: { title: string; slug: string; posts: PostCard[] }[] }) {
  return (
    <section className="px-4 md:px-10">
      <div className="mx-auto grid max-w-[1200px] gap-8 border-b border-line px-2.5 pb-6 pt-12 lg:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.slug} className="p-2.5">
            <SectionHeader title={b.title} href={categoryUrl(b.slug)} linkLabel={`Selengkapnya di ${b.title}`} />
            <div className="grid gap-[30px] pt-5 sm:grid-cols-2">
              {b.posts.map((p) => (
                <StackedCard key={p.id} post={p} showAuthor={false} showComments imageGap="pb-[15px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WebsiteBanner({ href }: { href: string }) {
  return (
    <div className="flex justify-center px-4 py-6">
      <a href={href} target="_blank" rel="noopener noreferrer sponsored" className="block w-full max-w-[1024px]">
        <img src="/images/ad-website.png" alt="Jasa Pembuatan Website Mulai dari 500 Ribu" width={1024} height={126} loading="lazy" className="h-auto w-full" />
      </a>
    </div>
  );
}
