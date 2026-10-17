import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "./db";
import { firstImageInContent, mediaUrl } from "./media";
import { stripTags, trimWords } from "./format";

const cardInclude = {
  author: { select: { displayName: true, nicename: true } },
  featured: true,
  terms: { include: { term: true } },
  _count: { select: { comments: { where: { status: "approved" } } } },
} satisfies Prisma.PostInclude;

type PostWithCard = Prisma.PostGetPayload<{ include: typeof cardInclude }>;

export type PostCard = {
  id: number;
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  date: Date;
  author: string;
  authorSlug: string;
  image: string | null;
  imageLarge: string | null;
  imageAlt: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  commentCount: number;
};

export const postUrl = (slug: string) => `/${slug}/`;
export const categoryUrl = (slug: string) => `/category/${slug}/`;
export const tagUrl = (slug: string) => `/tag/${slug}/`;

export function toCard(p: PostWithCard, excerptWords = 55): PostCard {
  const excerptSource = p.excerpt || stripTags(p.content);
  const fallbackImage = firstImageInContent(p.content);
  return {
    id: p.id,
    slug: p.slug,
    url: postUrl(p.slug),
    title: p.title,
    excerpt: trimWords(excerptSource, excerptWords),
    date: p.publishedAt,
    author: p.author?.displayName ?? "admin",
    authorSlug: p.author?.nicename ?? "admin",
    image: mediaUrl(p.featured, "medium_large") ?? fallbackImage,
    imageLarge: mediaUrl(p.featured, "large") ?? fallbackImage,
    imageAlt: p.featured?.alt || p.title,
    categories: p.terms
      .filter((t) => t.term.taxonomy === "category")
      .map((t) => ({ name: t.term.name, slug: t.term.slug }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    tags: p.terms.filter((t) => t.term.taxonomy === "post_tag").map((t) => ({ name: t.term.name, slug: t.term.slug })),
    commentCount: p._count.comments,
  };
}

const published = (): Prisma.PostWhereInput => ({ type: "post", status: "publish", publishedAt: { lte: new Date() } });

export async function getPosts(opts: {
  where?: Prisma.PostWhereInput;
  take?: number;
  skip?: number;
  excerptWords?: number;
  withTotal?: boolean;
}) {
  const where = { ...published(), ...opts.where };
  const [rows, total] = await Promise.all([
    db.post.findMany({
      where,
      include: cardInclude,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: opts.take,
      skip: opts.skip,
    }),
    opts.withTotal === false ? Promise.resolve(0) : db.post.count({ where }),
  ]);
  return { posts: rows.map((r) => toCard(r, opts.excerptWords)), total };
}

export async function getPostsInCategory(slug: string, take: number, excerptWords = 15) {
  const { posts } = await getPosts({
    where: { terms: { some: { term: { taxonomy: "category", slug } } } },
    take,
    excerptWords,
    withTotal: false,
  });
  return posts;
}

export const getTerm = cache((taxonomy: string, slug: string) =>
  db.term.findUnique({ where: { taxonomy_slug: { taxonomy, slug } } }),
);

export const getCategoriesWithCount = cache(async () => {
  const terms = await db.term.findMany({
    where: { taxonomy: "category" },
    include: { _count: { select: { posts: { where: { post: { status: "publish", type: "post" } } } } } },
    orderBy: { name: "asc" },
  });
  return terms.filter((t) => t._count.posts > 0).map((t) => ({ name: t.name, slug: t.slug, count: t._count.posts }));
});

export const getRecentPosts = cache(async (take = 5) => {
  const { posts } = await getPosts({ take, withTotal: false });
  return posts;
});

const singularInclude = {
  ...cardInclude,
  comments: { where: { status: "approved" }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.PostInclude;

export type SingularPost = Prisma.PostGetPayload<{ include: typeof singularInclude }>;

export const getContentBySlug = cache(async (slug: string) => {
  const post = await db.post.findFirst({
    where: { type: "post", slug, status: "publish", publishedAt: { lte: new Date() } },
    include: singularInclude,
  });
  return post;
});

export const getContentById = (id: number) => db.post.findUnique({ where: { id }, include: singularInclude });

export async function getAdjacentPost(post: { id: number; publishedAt: Date }, direction: "prev" | "next") {
  const row = await db.post.findFirst({
    where: {
      ...published(),
      publishedAt: direction === "prev" ? { lt: post.publishedAt } : { gt: post.publishedAt, lte: new Date() },
    },
    orderBy: { publishedAt: direction === "prev" ? "desc" : "asc" },
    select: { slug: true, title: true },
  });
  return row;
}

export async function getRelatedPosts(postId: number, categorySlugs: string[], take = 2) {
  const { posts } = await getPosts({
    where: {
      id: { not: postId },
      terms: { some: { term: { taxonomy: "category", slug: { in: categorySlugs } } } },
    },
    take,
    withTotal: false,
  });
  return posts;
}
