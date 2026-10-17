import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { db } from "@/lib/db";
import { stripTags, trimWords } from "@/lib/format";
import { getContentBySlug, postUrl } from "@/lib/posts";
import { ogImageFor, pageMetadata, withSiteName } from "@/lib/seo";
import SingularView from "@/components/site/SingularView";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function load(params: Props["params"]) {
  const slug = decodeURIComponent((await params).slug);
  return { slug, post: await getContentBySlug(slug) };
}

export async function generateStaticParams() {
  const rows = await db.post.findMany({ where: { type: "post", status: "publish" }, select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { post } = await load(params);
  if (!post) return {};
  const description = post.seoDescription || trimWords(post.excerpt || stripTags(post.content), 30);
  const hasImage = !!post.featuredId || /<img/i.test(post.content);
  return pageMetadata({
    title: post.seoTitle || (await withSiteName(post.title)),
    description,
    path: postUrl(post.slug),
    type: "article",
    image: hasImage ? ogImageFor(post.id, post.updatedAt) : undefined,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    section: post.terms.find((t) => t.term.taxonomy === "category")?.term.name,
    tags: post.terms.filter((t) => t.term.taxonomy === "post_tag").map((t) => t.term.name),
  });
}

export default async function SingularPage({ params }: Props) {
  const { slug, post } = await load(params);

  if (!post) {
    // Slug lama yang sudah diganti di admin → redirect 301 (seperti _wp_old_slug)
    const redirect = await db.redirect.findUnique({ where: { from: `/${slug}/` } });
    if (redirect) permanentRedirect(redirect.to);
    notFound();
  }

  return <SingularView post={post} />;
}
