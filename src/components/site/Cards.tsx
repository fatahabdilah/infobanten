/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { categoryUrl, type PostCard } from "@/lib/posts";

export function MoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center whitespace-nowrap text-base font-bold leading-4 text-primary hover:text-primary-dark"
    >
      {label}
      <img src="/images/icon-arrow.svg" alt="" width={15} height={15} className="ml-2" />
    </Link>
  );
}

const HEADING_SIZE = {
  sm: "text-xl leading-6",
  md: "text-2xl leading-[28.8px]",
  lg: "text-[26px] leading-[1.2] md:text-[32px] md:leading-[38.4px]",
};

export function SectionHeader({
  title,
  href,
  linkLabel,
  size = "md",
  as: Tag = "h2",
}: {
  title: string;
  href: string;
  linkLabel: string;
  size?: keyof typeof HEADING_SIZE;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-2.5 pb-4 pt-2.5">
      <Tag className={`font-heading font-bold text-heading ${HEADING_SIZE[size]}`}>{title}</Tag>
      <MoreLink href={href} label={linkLabel} />
    </div>
  );
}

export function CategoryPills({ categories, variant = "solid" }: { categories: PostCard["categories"]; variant?: "solid" | "light" }) {
  if (!categories.length) return null;
  return (
    <div className="flex flex-wrap gap-x-[5px] gap-y-5 pb-5">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={categoryUrl(c.slug)}
          className={`rounded-[2px] py-1.5 text-sm font-medium capitalize leading-[14px] ${
            variant === "solid" ? "bg-primary px-2 text-white hover:bg-primary-dark" : "bg-white px-3 text-primary hover:bg-primary hover:text-white"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}

export function PostMeta({
  post,
  showAuthor = true,
  showComments = false,
  className = "",
}: {
  post: PostCard;
  showAuthor?: boolean;
  showComments?: boolean;
  className?: string;
}) {
  const items = [
    showAuthor ? post.author : null,
    formatDate(post.date),
    showComments ? (post.commentCount ? `${post.commentCount} Komentar` : "Tidak Ada Komentar") : null,
  ].filter(Boolean);
  return (
    <p className={`text-sm font-medium capitalize leading-[23px] ${className}`}>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="px-2">·</span>}
          {item}
        </span>
      ))}
    </p>
  );
}

/** Kartu standar: gambar, (label), judul, meta, ringkasan */
export function StackedCard({
  post,
  pills,
  showMeta = true,
  showExcerpt = true,
  showAuthor = true,
  showComments = false,
  imageGap = "pb-4",
}: {
  post: PostCard;
  pills?: "solid" | "light";
  showMeta?: boolean;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showComments?: boolean;
  imageGap?: string;
}) {
  return (
    <article className="flex min-w-0 flex-col">
      {post.image && (
        <Link href={post.url} className={`block ${imageGap}`}>
          <img src={post.image} alt={post.imageAlt} loading="lazy" className="h-auto w-full object-cover" />
        </Link>
      )}
      {pills && <CategoryPills categories={post.categories} variant={pills} />}
      <h3 className="pb-2 font-heading text-xl font-bold leading-6 text-heading">
        <Link href={post.url} className="hover:text-primary">
          {post.title}
        </Link>
      </h3>
      {showMeta && <PostMeta post={post} showAuthor={showAuthor} showComments={showComments} className="pb-2 text-body" />}
      {showExcerpt && <p className="text-base leading-[25.6px] text-body">{post.excerpt}</p>}
    </article>
  );
}

/** Kartu dengan gambar latar + overlay gelap (Olahraga, Wisata) */
export function OverlayCard({ post, className = "" }: { post: PostCard; className?: string }) {
  return (
    <article className={`group relative min-h-[360px] overflow-hidden bg-heading md:h-[476px] ${className}`}>
      {post.imageLarge && (
        <img
          src={post.imageLarge}
          alt={post.imageAlt}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-x-6 bottom-6 md:top-[280px] md:bottom-auto">
        <h3 className="font-heading text-xl font-bold leading-[1.2] text-white md:text-2xl md:leading-[28.8px]">
          <Link href={post.url} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-[15px] line-clamp-3 text-base leading-[25.6px] text-white">{post.excerpt}</p>
      </div>
    </article>
  );
}
