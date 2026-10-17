/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { categoryUrl, type PostCard } from "@/lib/posts";
import Sidebar from "./Sidebar";

/** Layout arsip bergaya Astra (Figma 192:5559): daftar post + sidebar */
export default function ArchiveView({
  title,
  description,
  posts,
  page,
  totalPages,
  pageHref,
  emptyMessage = "Belum ada tulisan.",
}: {
  title: string;
  description?: string;
  posts: PostCard[];
  page: number;
  totalPages: number;
  pageHref: (n: number) => string;
  emptyMessage?: string;
}) {
  return (
    <div className="px-4 md:px-5">
      <div className="mx-auto flex max-w-[1199px] flex-col gap-12 py-10 lg:flex-row lg:gap-0 lg:py-16">
        <div className="min-w-0 lg:w-[812px] lg:shrink-0 lg:border-r lg:border-line-strong lg:pr-[60px]">
          <header className="border-b border-line-strong py-8 md:p-12">
            <h1 className="font-heading text-[32px] font-light leading-[1.4] text-heading md:text-[40px] md:leading-[56px]">{title}</h1>
            {description && <p className="mt-2 text-base leading-[25.6px] text-body">{description}</p>}
          </header>

          <div className="flex flex-col gap-10 pt-10">
            {posts.length === 0 && <p className="text-base text-body">{emptyMessage}</p>}
            {posts.map((p) => (
              <article key={p.id} className="border-b border-line-strong pb-[12.8px]">
                {p.imageLarge && (
                  <Link href={p.url} aria-label={`Baca: ${p.title}`} className="block">
                    <img src={p.imageLarge} alt={p.imageAlt} loading="lazy" className="h-auto max-w-full" />
                  </Link>
                )}
                <h2 className="pt-6 font-heading text-2xl leading-[1.3] text-body md:text-[32px] md:leading-[41.6px]">
                  <Link href={p.url} className="hover:text-primary">
                    {p.title}
                  </Link>
                </h2>
                <p className="pt-[6.4px] text-base leading-[23.2px] text-heading">
                  {p.categories.map((c, i) => (
                    <span key={c.slug}>
                      {i > 0 && ", "}
                      <Link href={categoryUrl(c.slug)} className="hover:text-primary">
                        {c.name}
                      </Link>
                    </span>
                  ))}
                  {p.categories.length > 0 && " / "}
                  <Link href={`/author/${p.authorSlug}/`} className="hover:text-primary">
                    {p.author}
                  </Link>
                </p>
                <p className="pt-[19.2px] text-base leading-[25.6px] text-body">{p.excerpt}</p>
                <p className="pt-6">
                  <Link href={p.url} className="text-base leading-[25.6px] text-heading hover:text-primary">
                    Read More »
                  </Link>
                </p>
              </article>
            ))}
          </div>

          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} pageHref={pageHref} />}
        </div>

        <div className="lg:w-[347px] lg:shrink-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, pageHref }: { page: number; totalPages: number; pageHref: (n: number) => string }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2,
  );
  const base = "flex h-10 min-w-10 items-center justify-center rounded-[2px] border px-3 text-base";
  const idle = `${base} border-line-strong bg-white text-heading hover:border-primary hover:text-primary`;
  return (
    <nav aria-label="Navigasi halaman" className="flex flex-wrap items-center gap-2 pt-10">
      {page > 1 && (
        <Link href={pageHref(page - 1)} className={idle}>
          ← Sebelumnya
        </Link>
      )}
      {pages.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - pages[i - 1] > 1 && <span className="px-1">…</span>}
          {n === page ? (
            <span aria-current="page" className={`${base} border-primary bg-primary text-white`}>
              {n}
            </span>
          ) : (
            <Link href={pageHref(n)} className={idle}>
              {n}
            </Link>
          )}
        </span>
      ))}
      {page < totalPages && (
        <Link href={pageHref(page + 1)} className={idle}>
          Selanjutnya →
        </Link>
      )}
    </nav>
  );
}
