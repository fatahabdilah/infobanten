import type { Metadata } from "next";
import { getPosts } from "@/lib/posts";
import { pageMetadata, withSiteName } from "@/lib/seo";
import { getOptions } from "@/lib/site";
import ArchiveView from "@/components/site/ArchiveView";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const s = first((await searchParams).s).trim();
  return pageMetadata({ title: await withSiteName(`Kamu mencari ${s}`), path: `/?s=${encodeURIComponent(s)}`, noindex: true });
}

/** Hasil pencarian WordPress-style: /?s=kata (di-rewrite ke sini) */
export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = first(sp.s).trim();
  const page = Math.max(1, Number(first(sp.paged)) || 1);
  const { postsPerPage } = await getOptions();
  const { posts, total } = await getPosts({
    where: q
      ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { content: { contains: q, mode: "insensitive" as const } }] }
      : {},
    take: postsPerPage,
    skip: (page - 1) * postsPerPage,
  });
  return (
    <div className="pt-[100px] md:pt-[122px]">
      <ArchiveView
        title={`Hasil Pencarian untuk: ${q}`}
        posts={posts}
        page={page}
        totalPages={Math.ceil(total / postsPerPage)}
        pageHref={(n) => `/?s=${encodeURIComponent(q)}${n > 1 ? `&paged=${n}` : ""}`}
        emptyMessage="Maaf, tidak ada yang cocok dengan kata kunci pencarian Anda. Silakan coba lagi dengan kata kunci yang berbeda."
      />
    </div>
  );
}
