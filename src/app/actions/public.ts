"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";
import { db } from "@/lib/db";
import { getOptions } from "@/lib/site";

export type FormState = { ok: boolean; message: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Masukkan alamat email yang valid." };
  await db.subscriber.upsert({ where: { email }, create: { email }, update: {} });
  return { ok: true, message: "Terima kasih! Anda sudah berlangganan berita Info Banten." };
}

export async function submitComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const postId = Number(formData.get("postId"));
  const name = String(formData.get("author") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const text = String(formData.get("comment") || "").trim();
  const parentId = Number(formData.get("parentId")) || null;

  // Honeypot anti-spam: field tersembunyi harus kosong
  if (formData.get("website_hp")) return { ok: true, message: "Komentar Anda sedang menunggu moderasi." };
  if (!name || !EMAIL_RE.test(email) || !text) return { ok: false, message: "Nama, email, dan komentar wajib diisi." };
  if (text.length > 5000) return { ok: false, message: "Komentar terlalu panjang." };

  const post = await db.post.findUnique({ where: { id: postId }, select: { commentStatus: true, slug: true, status: true } });
  if (!post || post.status !== "publish" || post.commentStatus !== "open")
    return { ok: false, message: "Komentar ditutup untuk tulisan ini." };

  const { commentModeration } = await getOptions();
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim();
  const content = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).replace(/\n/g, "<br />");

  await db.comment.create({
    data: {
      postId,
      parentId,
      authorName: name.slice(0, 100),
      authorEmail: email.slice(0, 200),
      authorUrl: /^https?:\/\//.test(url) ? url.slice(0, 200) : "",
      authorIp: ip,
      content,
      status: commentModeration ? "pending" : "approved",
    },
  });
  revalidatePath(`/${post.slug}/`);
  return {
    ok: true,
    message: commentModeration ? "Komentar Anda sedang menunggu moderasi." : "Komentar Anda telah diterbitkan.",
  };
}
