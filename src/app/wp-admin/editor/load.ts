import { notFound, redirect } from "next/navigation";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAdminDate, toLocalInput } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { getOptions, SITE_URL } from "@/lib/site";
import type { EditorInitial } from "@/components/admin/editor/PostEditor";

export async function loadEditor(opts: { id?: number }) {
  const user = await requireUser("edit_posts");
  const [categories, authors, site] = await Promise.all([
    db.term.findMany({ where: { taxonomy: "category" }, orderBy: { name: "asc" }, select: { id: true, name: true, parentId: true } }),
    can(user.role, "edit_others_posts")
      ? db.user.findMany({ where: { role: { not: "subscriber" } }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true } })
      : Promise.resolve([{ id: user.id, displayName: user.displayName }]),
    getOptions(),
  ]);

  let initial: EditorInitial;
  if (opts.id) {
    const post = await db.post.findUnique({ where: { id: opts.id }, include: { featured: true, terms: { include: { term: true } } } });
    if (!post || post.type !== "post") notFound();
    if (post.status === "trash") redirect("/wp-admin/edit.php?post_status=trash");
    if (post.authorId !== user.id && !can(user.role, "edit_others_posts")) redirect("/wp-admin/?denied=1");
    const scheduled = post.status === "publish" && post.publishedAt > new Date();
    initial = {
      id: post.id,
      type: "post",
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      slug: post.slug,
      status: post.status as EditorInitial["status"],
      savedStatus: scheduled ? "future" : post.status,
      date: toLocalInput(post.publishedAt),
      dateIsAuto: post.status === "draft" || post.status === "pending",
      authorId: post.authorId ?? user.id,
      categories: post.terms.filter((t) => t.term.taxonomy === "category").map((t) => t.termId),
      tags: post.terms.filter((t) => t.term.taxonomy === "post_tag").map((t) => t.term.name),
      featured: post.featured ? { id: post.featured.id, url: mediaUrl(post.featured, "medium")!, alt: post.featured.alt } : null,
      commentStatus: post.commentStatus === "closed" ? "closed" : "open",
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      sticky: post.sticky,
      modified: formatAdminDate(post.updatedAt),
    };
  } else {
    initial = {
      type: "post",
      title: "",
      content: "",
      excerpt: "",
      slug: "",
      status: "draft",
      savedStatus: "",
      date: toLocalInput(new Date()),
      dateIsAuto: true,
      authorId: user.id,
      categories: [],
      tags: [],
      featured: null,
      commentStatus: "open",
      seoTitle: "",
      seoDescription: "",
      sticky: false,
    };
  }

  return {
    initial,
    categories,
    authors: authors.map((a) => ({ id: a.id, name: a.displayName })),
    canPublish: can(user.role, "publish_posts"),
    siteUrl: SITE_URL,
    siteName: site.blogname,
  };
}
