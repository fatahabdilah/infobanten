"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can, requireUser, type Role } from "@/lib/auth";
import { db } from "@/lib/db";
import { fromLocalInput, slugify } from "@/lib/format";
import { createUploadUrl, usingSupabase } from "@/lib/storage";
import { deleteUploadFiles, finalizeTempUpload, sanitizeFileName, saveUpload, validateUpload } from "@/lib/upload";

const refreshSite = () => revalidatePath("/", "layout");

/* ───────────────────────── Pos ───────────────────────── */

export type PostInput = {
  id?: number;
  type: "post";
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: "publish" | "draft" | "pending" | "private" | "future";
  date: string | null; // datetime-local WIB, null = sekarang
  authorId?: number;
  categories: number[];
  tags: string[];
  featuredId: number | null;
  commentStatus: "open" | "closed";
  seoTitle: string;
  seoDescription: string;
  sticky: boolean;
};

export type SaveResult = { ok: true; id: number; slug: string; status: string; message: string } | { ok: false; message: string };

async function uniqueSlug(type: string, wanted: string, excludeId?: number) {
  const base = wanted || "tanpa-judul";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await db.post.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined } });
    if (!clash) return slug;
    slug = `${base}-${i}`;
  }
}

export async function savePost(input: PostInput): Promise<SaveResult> {
  const user = await requireUser("edit_posts");
  const existing = input.id ? await db.post.findUnique({ where: { id: input.id } }) : null;
  if (input.id && !existing) return { ok: false, message: "Tulisan tidak ditemukan." };
  if (existing && existing.authorId !== user.id && !can(user.role, "edit_others_posts"))
    return { ok: false, message: "Anda tidak diizinkan menyunting tulisan ini." };

  let status: string = input.status;
  // Contributor hanya bisa kirim untuk ditinjau
  if (!can(user.role, "publish_posts") && (status === "publish" || status === "future" || status === "private")) status = "pending";

  const publishedAt = input.date ? fromLocalInput(input.date) : existing?.status === "publish" ? existing.publishedAt : new Date();
  if (status === "publish" && publishedAt > new Date(Date.now() + 60_000)) status = "future";
  if (status === "future" && publishedAt <= new Date()) status = "publish";

  const wantedSlug = slugify(input.slug || input.title);
  const slug = await uniqueSlug(input.type, wantedSlug, existing?.id);

  const tagIds: number[] = [];
  for (const name of [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))]) {
    const tagSlug = slugify(name);
    const tag = await db.term.upsert({
      where: { taxonomy_slug: { taxonomy: "post_tag", slug: tagSlug } },
      create: { taxonomy: "post_tag", name, slug: tagSlug },
      update: {},
    });
    tagIds.push(tag.id);
  }
  const { defaultCategory } = await import("@/lib/site").then((m) => m.getOptions());
  const categories = input.type === "post" ? (input.categories.length ? input.categories : [defaultCategory]) : [];

  const data = {
    type: input.type,
    title: input.title.trim(),
    content: input.content,
    excerpt: input.excerpt.trim(),
    slug,
    status: status === "future" ? "publish" : status,
    publishedAt,
    authorId: can(user.role, "edit_others_posts") && input.authorId ? input.authorId : existing?.authorId ?? user.id,
    featuredId: input.featuredId,
    commentStatus: input.commentStatus,
    seoTitle: input.seoTitle.trim(),
    seoDescription: input.seoDescription.trim(),
    sticky: input.type === "post" && input.sticky,
  };
  const terms = [...categories, ...(input.type === "post" ? tagIds : [])].map((termId) => ({ termId }));

  const saved = existing
    ? await db.post.update({ where: { id: existing.id }, data: { ...data, terms: { deleteMany: {}, create: terms } } })
    : await db.post.create({ data: { ...data, terms: { create: terms } } });

  // Slug berubah pada konten terbit → simpan redirect 301 dari URL lama (seperti _wp_old_slug)
  if (existing && existing.status === "publish" && existing.slug !== saved.slug) {
    const from = `/${existing.slug}/`;
    const to = `/${saved.slug}/`;
    await db.redirect.upsert({ where: { from }, create: { from, to }, update: { to } });
    await db.redirect.updateMany({ where: { to: from }, data: { to } });
    await db.redirect.deleteMany({ where: { from: to } });
  }

  refreshSite();
  const scheduled = saved.status === "publish" && saved.publishedAt > new Date();
  const label = "Pos";
  const message = scheduled
    ? `${label} dijadwalkan.`
    : saved.status === "publish"
      ? existing?.status === "publish"
        ? `${label} diperbarui.`
        : `${label} diterbitkan.`
      : saved.status === "pending"
        ? `${label} dikirim untuk ditinjau.`
        : saved.status === "private"
          ? `${label} disimpan secara privat.`
          : `Draf ${label.toLowerCase()} disimpan.`;
  return { ok: true, id: saved.id, slug: saved.slug, status: scheduled ? "future" : saved.status, message };
}

async function postsUserMayEdit(ids: number[]) {
  const user = await requireUser("edit_posts");
  const rows = await db.post.findMany({ where: { id: { in: ids } } });
  return rows.filter((p) => p.authorId === user.id || can(user.role, "edit_others_posts")).map((p) => p.id);
}

export async function bulkPosts(formData: FormData) {
  const action = String(formData.get("action") || formData.get("action2") || "");
  const ids = formData.getAll("post[]").map(Number).filter(Boolean);
  const back = String(formData.get("_back") || "/wp-admin/edit.php");
  if (!ids.length || action === "-1") redirect(back);
  const allowed = await postsUserMayEdit(ids);
  const join = back.includes("?") ? "&" : "?";
  if (action === "trash") await db.post.updateMany({ where: { id: { in: allowed } }, data: { status: "trash" } });
  else if (action === "untrash") await db.post.updateMany({ where: { id: { in: allowed } }, data: { status: "draft" } });
  else if (action === "delete") await db.post.deleteMany({ where: { id: { in: allowed }, status: "trash" } });
  else if (action === "publish" || action === "draft") await db.post.updateMany({ where: { id: { in: allowed } }, data: { status: action } });
  refreshSite();
  redirect(`${back}${join}${action === "trash" ? "trashed" : action === "untrash" ? "untrashed" : action === "delete" ? "deleted" : "updated"}=${allowed.length}`);
}

export async function trashPost(id: number) {
  const [allowed] = await postsUserMayEdit([id]);
  if (allowed) await db.post.update({ where: { id }, data: { status: "trash" } });
  refreshSite();
}

/* ───────────────────────── Kategori & Tag ───────────────────────── */

export type TermState = { ok: boolean; message: string } | null;

export async function saveTerm(_prev: TermState, formData: FormData): Promise<TermState> {
  await requireUser("manage_categories");
  const id = Number(formData.get("tag_ID")) || null;
  const taxonomy = formData.get("taxonomy") === "post_tag" ? "post_tag" : "category";
  const name = String(formData.get("tag-name") || "").trim();
  const slug = slugify(String(formData.get("slug") || "") || name);
  const description = String(formData.get("description") || "").trim();
  const parentId = taxonomy === "category" ? Number(formData.get("parent")) || null : null;
  if (!name) return { ok: false, message: "Nama wajib diisi." };
  const clash = await db.term.findFirst({ where: { taxonomy, slug, id: id ? { not: id } : undefined } });
  if (clash) return { ok: false, message: "Slug sudah digunakan oleh istilah lain." };
  if (id) await db.term.update({ where: { id }, data: { name, slug, description, parentId } });
  else await db.term.create({ data: { taxonomy, name, slug, description, parentId } });
  refreshSite();
  if (id) redirect(`/wp-admin/edit-tags.php?taxonomy=${taxonomy}&message=3`);
  return { ok: true, message: taxonomy === "category" ? "Kategori ditambahkan." : "Tag ditambahkan." };
}

export async function quickAddCategory(name: string, parentId: number | null) {
  await requireUser("edit_posts");
  const clean = name.trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const term = await db.term.upsert({
    where: { taxonomy_slug: { taxonomy: "category", slug } },
    create: { taxonomy: "category", name: clean, slug, parentId },
    update: {},
  });
  return { id: term.id, name: term.name, parentId: term.parentId };
}

export async function deleteTerms(formData: FormData) {
  await requireUser("manage_categories");
  const taxonomy = formData.get("taxonomy") === "post_tag" ? "post_tag" : "category";
  const ids = formData.getAll("delete_tags[]").map(Number).filter(Boolean);
  const { defaultCategory } = await import("@/lib/site").then((m) => m.getOptions());
  const deletable = ids.filter((id) => !(taxonomy === "category" && id === defaultCategory));
  if (taxonomy === "category") {
    // Pos tanpa kategori tersisa dipindah ke kategori default (perilaku WordPress)
    const affected = await db.postTerm.findMany({ where: { termId: { in: deletable } }, select: { postId: true } });
    await db.term.deleteMany({ where: { id: { in: deletable } } });
    for (const { postId } of affected) {
      const left = await db.postTerm.count({ where: { postId, term: { taxonomy: "category" } } });
      if (!left) await db.postTerm.create({ data: { postId, termId: defaultCategory } }).catch(() => {});
    }
  } else await db.term.deleteMany({ where: { id: { in: deletable } } });
  refreshSite();
  redirect(`/wp-admin/edit-tags.php?taxonomy=${taxonomy}&message=2`);
}

/* ───────────────────────── Media ───────────────────────── */

export async function uploadMedia(formData: FormData) {
  const user = await requireUser("upload_files");
  const files = formData.getAll("async-upload").filter((f): f is File => f instanceof File && f.size > 0);
  const results: { ok: boolean; name: string; id?: number; message?: string }[] = [];
  for (const file of files) {
    try {
      const m = await saveUpload(file, user.id);
      results.push({ ok: true, name: file.name, id: m.id });
    } catch (e) {
      results.push({ ok: false, name: file.name, message: (e as Error).message });
    }
  }
  return results;
}

/** Mode unggah: "direct" = browser langsung ke Supabase Storage (tanpa batas body server) */
export async function uploadMode() {
  await requireUser("upload_files");
  return usingSupabase() ? ("direct" as const) : ("server" as const);
}

export async function requestDirectUpload(name: string, mime: string, size: number) {
  await requireUser("upload_files");
  validateUpload(mime, size);
  const { base, ext } = sanitizeFileName(name);
  const rel = `tmp/${crypto.randomUUID()}/${base}${ext}`;
  return createUploadUrl(rel);
}

export async function finalizeDirectUpload(tmpPath: string, name: string, mime: string) {
  const user = await requireUser("upload_files");
  try {
    const m = await finalizeTempUpload(tmpPath, name, mime, user.id);
    return { ok: true as const, name, id: m.id };
  } catch (e) {
    return { ok: false as const, name, message: (e as Error).message };
  }
}

export async function updateMedia(id: number, data: { title: string; alt: string; caption: string }) {
  await requireUser("upload_files");
  await db.media.update({ where: { id }, data });
  refreshSite();
}

export async function deleteMedia(id: number) {
  const user = await requireUser("upload_files");
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return;
  if (media.authorId !== user.id && !can(user.role, "edit_others_posts")) throw new Error("Tidak diizinkan.");
  await db.media.delete({ where: { id } });
  await deleteUploadFiles(media);
  refreshSite();
}

/* ───────────────────────── Komentar ───────────────────────── */

export async function bulkComments(formData: FormData) {
  await requireUser("moderate_comments");
  const action = String(formData.get("action") || "");
  const ids = formData.getAll("delete_comments[]").map(Number).filter(Boolean);
  const back = String(formData.get("_back") || "/wp-admin/edit-comments.php");
  const status: Record<string, string> = { approve: "approved", unapprove: "pending", spam: "spam", unspam: "pending", trash: "trash", untrash: "pending" };
  if (action === "delete") await db.comment.deleteMany({ where: { id: { in: ids } } });
  else if (status[action]) await db.comment.updateMany({ where: { id: { in: ids } }, data: { status: status[action] } });
  refreshSite();
  redirect(back);
}

export async function replyComment(postId: number, parentId: number, content: string) {
  const user = await requireUser("moderate_comments");
  const text = content.trim();
  if (!text) return;
  await db.comment.create({
    data: {
      postId,
      parentId,
      authorName: user.displayName,
      authorEmail: user.email,
      content: text.replace(/</g, "&lt;").replace(/\n/g, "<br />"),
      status: "approved",
    },
  });
  await db.comment.update({ where: { id: parentId }, data: { status: "approved" } });
  refreshSite();
}

/* ───────────────────────── Pengguna ───────────────────────── */

export type UserState = { ok: boolean; message: string } | null;
const ROLES: Role[] = ["administrator", "editor", "author", "contributor", "subscriber"];

export async function saveUser(_prev: UserState, formData: FormData): Promise<UserState> {
  const me = await requireUser();
  const id = Number(formData.get("user_id")) || null;
  const isSelf = id === me.id;
  if (!isSelf && !can(me.role, "list_users")) return { ok: false, message: "Anda tidak diizinkan." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") || "").trim();
  const bio = String(formData.get("description") || "").trim();
  const pass = String(formData.get("pass1") || "");
  const roleInput = String(formData.get("role") || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Alamat email tidak valid." };
  if (pass && pass.length < 8) return { ok: false, message: "Kata sandi minimal 8 karakter." };

  const emailClash = await db.user.findFirst({ where: { email, id: id ? { not: id } : undefined } });
  if (emailClash) return { ok: false, message: "Email ini sudah terdaftar." };

  const role = can(me.role, "list_users") && ROLES.includes(roleInput as Role) && !isSelf ? roleInput : undefined;

  if (id) {
    await db.user.update({
      where: { id },
      data: {
        email,
        displayName: displayName || email,
        bio,
        ...(role ? { role } : {}),
        ...(pass ? { passwordHash: await bcrypt.hash(pass, 10) } : {}),
      },
    });
    refreshSite();
    return { ok: true, message: isSelf ? "Profil diperbarui." : "Pengguna diperbarui." };
  }

  const login = slugify(String(formData.get("user_login") || "")).replace(/-/g, "") || "";
  if (!login) return { ok: false, message: "Nama pengguna wajib diisi (huruf & angka)." };
  if (!pass) return { ok: false, message: "Kata sandi wajib diisi." };
  if (await db.user.findUnique({ where: { login } })) return { ok: false, message: "Nama pengguna sudah dipakai." };
  await db.user.create({
    data: { login, nicename: login, email, displayName: displayName || login, bio, role: role ?? "author", passwordHash: await bcrypt.hash(pass, 10) },
  });
  redirect("/wp-admin/users.php?update=add");
}

export async function deleteUser(formData: FormData) {
  const me = await requireUser("list_users");
  const id = Number(formData.get("user_id"));
  if (!id || id === me.id) redirect("/wp-admin/users.php");
  const reassign = Number(formData.get("reassign_user")) || me.id;
  await db.post.updateMany({ where: { authorId: id }, data: { authorId: reassign } });
  await db.user.delete({ where: { id } });
  refreshSite();
  redirect("/wp-admin/users.php?update=del");
}

/* ───────────────────────── Pengaturan ───────────────────────── */

export async function saveSettings(formData: FormData) {
  await requireUser("manage_options");
  const keys = ["blogname", "blogdescription", "posts_per_page", "contact_phone", "contact_whatsapp", "default_category"];
  for (const key of keys) {
    const value = String(formData.get(key) ?? "").trim();
    await db.option.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  const moderation = formData.get("comment_moderation") ? "1" : "0";
  await db.option.upsert({ where: { key: "comment_moderation" }, create: { key: "comment_moderation", value: moderation }, update: { value: moderation } });
  refreshSite();
  redirect("/wp-admin/options-general.php?settings-updated=true");
}

/* ───────────────────────── Pelanggan ───────────────────────── */

export async function deleteSubscribers(formData: FormData) {
  await requireUser("moderate_comments");
  const ids = formData.getAll("subscriber[]").map(Number).filter(Boolean);
  await db.subscriber.deleteMany({ where: { id: { in: ids } } });
  redirect("/wp-admin/subscribers/?deleted=" + ids.length);
}

/* ───────────────────────── Draf Cepat (dasbor) ───────────────────────── */

export async function quickDraft(formData: FormData) {
  const user = await requireUser("edit_posts");
  const title = String(formData.get("post_title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!title && !content) redirect("/wp-admin/");
  const slug = await uniqueSlug("post", slugify(title) || "draf");
  await db.post.create({
    data: {
      type: "post",
      status: "draft",
      title,
      slug,
      content: content ? content.split(/\n{2,}/).map((p) => `<p>${p.replace(/</g, "&lt;").replace(/\n/g, "<br />")}</p>`).join("\n") : "",
      authorId: user.id,
    },
  });
  redirect("/wp-admin/?draft=saved");
}

/** Aksi baris tunggal (Buang / Pulihkan / Hapus permanen) dari tabel daftar */
export async function rowPostAction(id: number, action: "trash" | "untrash" | "delete", back: string) {
  const [allowed] = await postsUserMayEdit([id]);
  if (allowed) {
    if (action === "trash") await db.post.update({ where: { id }, data: { status: "trash" } });
    if (action === "untrash") await db.post.update({ where: { id }, data: { status: "draft" } });
    if (action === "delete") await db.post.delete({ where: { id } });
  }
  refreshSite();
  const join = back.includes("?") ? "&" : "?";
  redirect(`${back}${join}${action === "trash" ? "trashed" : action === "untrash" ? "untrashed" : "deleted"}=1`);
}

/* ───────────────────────── Pustaka media (modal & grid) ───────────────────────── */

export type MediaItem = {
  id: number;
  url: string;
  thumb: string;
  medium: string;
  large: string;
  filename: string;
  title: string;
  alt: string;
  caption: string;
  mime: string;
  width: number | null;
  height: number | null;
  fileSize: number;
  date: string;
  author: string;
};

export async function listMedia(opts: { page?: number; search?: string; type?: "image" | "all"; ids?: number[] }) {
  await requireUser("edit_posts");
  const { mediaUrl } = await import("@/lib/media");
  const take = 40;
  const page = Math.max(1, opts.page ?? 1);
  const where = {
    ...(opts.ids ? { id: { in: opts.ids } } : {}),
    ...(opts.type === "image" ? { mime: { startsWith: "image/" } } : {}),
    ...(opts.search ? { OR: [{ title: { contains: opts.search, mode: "insensitive" as const } }, { path: { contains: opts.search, mode: "insensitive" as const } }, { alt: { contains: opts.search, mode: "insensitive" as const } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, take, skip: (page - 1) * take, include: { author: true } }),
    db.media.count({ where }),
  ]);
  const items: MediaItem[] = rows.map((m) => ({
    id: m.id,
    url: mediaUrl(m, "full")!,
    thumb: mediaUrl(m, "thumbnail")!,
    medium: mediaUrl(m, "medium")!,
    large: mediaUrl(m, "large")!,
    filename: m.path.split("/").pop()!,
    title: m.title,
    alt: m.alt,
    caption: m.caption,
    mime: m.mime,
    width: m.width,
    height: m.height,
    fileSize: m.fileSize,
    date: m.createdAt.toISOString(),
    author: m.author?.displayName ?? "",
  }));
  return { items, total, hasMore: page * take < total };
}

export async function deleteTerm(id: number, taxonomy: string) {
  const fd = new FormData();
  fd.set("taxonomy", taxonomy);
  fd.append("delete_tags[]", String(id));
  await deleteTerms(fd);
}

export async function rowCommentAction(id: number, action: string, back: string) {
  const fd = new FormData();
  fd.set("action", action);
  fd.set("_back", back);
  fd.append("delete_comments[]", String(id));
  await bulkComments(fd);
}

export async function deleteUserById(id: number) {
  const me = await requireUser("list_users");
  const fd = new FormData();
  fd.set("user_id", String(id));
  fd.set("reassign_user", String(me.id));
  await deleteUser(fd);
}
