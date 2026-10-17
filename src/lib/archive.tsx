import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { db } from "./db";
import { getPosts } from "./posts";
import { pageMetadata, withSiteName } from "./seo";
import { getOptions } from "./site";
import ArchiveView from "@/components/site/ArchiveView";

export type ArchiveKind = "category" | "tag" | "author" | "blog";

const BASE: Record<ArchiveKind, string> = { category: "/category/", tag: "/tag/", author: "/author/", blog: "/" };

async function resolve(kind: ArchiveKind, slug: string) {
  if (kind === "blog") return { title: "Blog", description: "", where: {} as Prisma.PostWhereInput };
  if (kind === "author") {
    const user = await db.user.findUnique({ where: { nicename: slug } });
    if (!user) return null;
    return { title: user.displayName, description: user.bio, where: { authorId: user.id } };
  }
  const taxonomy = kind === "category" ? "category" : "post_tag";
  const term = await db.term.findUnique({ where: { taxonomy_slug: { taxonomy, slug } } });
  if (!term) return null;
  return { title: term.name, description: term.description, where: { terms: { some: { termId: term.id } } } };
}

const archivePath = (kind: ArchiveKind, slug: string, n = 1) => {
  const base = kind === "blog" ? "/" : `${BASE[kind]}${slug}/`;
  return n > 1 ? `${base}page/${n}/` : base;
};

export async function archiveMetadata(kind: ArchiveKind, slug: string, pageParam?: string): Promise<Metadata> {
  const data = await resolve(kind, slug);
  if (!data) return {};
  const page = Number(pageParam) || 1;
  const label = kind === "author" ? data.title : data.title;
  const title = await withSiteName(page > 1 ? `${label} - Halaman ${page}` : label);
  return pageMetadata({ title, description: data.description || undefined, path: archivePath(kind, slug, page) });
}

export async function ArchivePage({ kind, slug, pageParam }: { kind: ArchiveKind; slug: string; pageParam?: string }) {
  const page = pageParam === undefined ? 1 : Number(pageParam);
  if (!Number.isInteger(page) || page < 1) notFound();
  const data = await resolve(kind, slug);
  if (!data) notFound();
  const { postsPerPage } = await getOptions();
  const { posts, total } = await getPosts({ where: data.where, take: postsPerPage, skip: (page - 1) * postsPerPage });
  const totalPages = Math.max(1, Math.ceil(total / postsPerPage));
  if (page > totalPages) notFound();
  return (
    <ArchiveView
      title={data.title}
      description={data.description}
      posts={posts}
      page={page}
      totalPages={totalPages}
      pageHref={(n) => archivePath(kind, slug, n)}
    />
  );
}
