/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { categoryUrl, getAdjacentPost, getRelatedPosts, postUrl, tagUrl, type SingularPost } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";
import CommentForm from "./CommentForm";
import ShareButtons from "./ShareButtons";

/** Tampilan satu berita (Figma 192:5909) */
export default async function SingularView({ post }: { post: SingularPost }) {
  const categories = post.terms.filter((t) => t.term.taxonomy === "category").map((t) => t.term);
  const tags = post.terms.filter((t) => t.term.taxonomy === "post_tag").map((t) => t.term);
  const [prev, next, related] = await Promise.all([
    getAdjacentPost(post, "prev"),
    getAdjacentPost(post, "next"),
    getRelatedPosts(post.id, categories.map((c) => c.slug)),
  ]);
  const url = absoluteUrl(postUrl(post.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author?.displayName ?? "admin" },
    image: [absoluteUrl(`/og/${post.id}.jpg`)],
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: "Info Banten", logo: { "@type": "ImageObject", url: absoluteUrl("/images/logo.png") } },
  };

  return (
    <div className="px-4 py-10 md:px-5 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[960px]">
        <article className="bg-white px-6 py-12 md:px-[106.72px] md:py-[85.44px]">
          <header>
            <h1 className="font-heading text-[26px] leading-[1.3] text-heading md:text-[32px] md:leading-[38.4px]">{post.title}</h1>
            <p className="pt-2.5 text-base leading-[23.2px] text-heading">
              {categories.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ", "}
                  <Link href={categoryUrl(c.slug)} className="hover:text-primary">
                    {c.name}
                  </Link>
                </span>
              ))}
              {categories.length > 0 && " / "}
              <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
              {" / "}
              <a href="#respond" className="hover:text-primary">
                {post.comments.length ? `${post.comments.length} Komentar` : "Tinggalkan Komentar"}
              </a>
            </p>
          </header>

          <div className="entry-content pt-8" dangerouslySetInnerHTML={{ __html: post.content }} />

          {tags.length > 0 && (
            <p className="flex flex-wrap gap-2 pt-8">
              {tags.map((t) => (
                <Link key={t.id} href={tagUrl(t.slug)} className="rounded-[2px] bg-page px-3 py-1.5 text-sm text-heading hover:bg-primary hover:text-white">
                  #{t.name}
                </Link>
              ))}
            </p>
          )}

          <ShareButtons url={url} title={post.title} />
        </article>

        <nav aria-label="Navigasi tulisan" className="flex justify-between gap-6 pt-8 text-base leading-[34.3px] text-heading">
          <div className="min-w-0 flex-1">
            {prev && (
              <Link href={postUrl(prev.slug)} className="hover:text-primary" title={prev.title}>
                ← Pos Sebelumnya
              </Link>
            )}
          </div>
          <div className="min-w-0 flex-1 text-right">
            {next && (
              <Link href={postUrl(next.slug)} className="hover:text-primary" title={next.title}>
                Pos Berikutnya →
              </Link>
            )}
          </div>
        </nav>

        {related.length > 0 && (
          <section className="mt-8 bg-white p-6 md:p-10">
            <h2 className="font-heading text-[30px] font-bold leading-[48px] text-heading">Must Read</h2>
            <div className="grid gap-[25px] pt-5 sm:grid-cols-2">
              {related.map((r) => (
                <article key={r.id} className="pb-4">
                  {r.image && (
                    <Link href={r.url} aria-label={`Baca selengkapnya: ${r.title}`}>
                      <img src={r.image} alt={r.imageAlt} loading="lazy" className="h-auto w-full" />
                    </Link>
                  )}
                  <h3 className="pt-4 font-heading text-xl leading-[26px] text-body">
                    <Link href={r.url} className="hover:text-primary">
                      {r.title}
                    </Link>
                  </h3>
                  <p className="pt-[7px] text-sm leading-[22.4px] text-heading">{r.categories.map((c) => c.name).join(", ")}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="respond" className="mt-8 mb-12 scroll-mt-6 bg-white px-6 py-12 md:px-[106.72px] md:py-16">
          {post.comments.length > 0 && (
            <div className="pb-10">
              <h2 className="font-heading text-[26px] leading-[42.9px] text-heading">{post.comments.length} Komentar</h2>
              <ol className="mt-4 space-y-6">
                {post.comments.map((c) => (
                  <li key={c.id} id={`comment-${c.id}`} className={`border-b border-line pb-6 ${c.parentId ? "ml-8" : ""}`}>
                    <p className="font-bold text-heading">
                      {c.authorUrl ? (
                        <a href={c.authorUrl} rel="nofollow ugc noopener" target="_blank" className="hover:text-primary">
                          {c.authorName}
                        </a>
                      ) : (
                        c.authorName
                      )}
                    </p>
                    <p className="text-sm text-body">{formatDate(c.createdAt)}</p>
                    <div className="entry-content mt-2" dangerouslySetInnerHTML={{ __html: c.content }} />
                  </li>
                ))}
              </ol>
            </div>
          )}
          {post.commentStatus === "open" ? (
            <>
              <h2 className="font-heading text-[26px] leading-[42.9px] text-heading">Tinggalkan Komentar</h2>
              <CommentForm postId={post.id} />
            </>
          ) : (
            <p className="text-body">Komentar ditutup.</p>
          )}
        </section>
      </div>
    </div>
  );
}
