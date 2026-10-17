/**
 * Import seluruh konten dari WordPress lama (via REST API) ke database Next.js.
 * ID, slug, tanggal, kategori, tag, dan file media dipertahankan apa adanya
 * sehingga semua URL lama (/slug/, /category/x/, /wp-content/uploads/...) tetap valid.
 *
 * Jalankan: npm run import:wp
 * Env: WP_SOURCE_URL (default https://infobanten.my.id), ADMIN_PASSWORD
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import he from "he";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ensureBucket, fileExists, putFile, usingSupabase } from "../src/lib/storage";

const prisma = new PrismaClient();
const SOURCE = (process.env.WP_SOURCE_URL || "https://infobanten.my.id").replace(/\/$/, "");
const API = `${SOURCE}/wp-json/wp/v2`;
// File WordPress diunduh dulu ke folder ini (cache), lalu diunggah ke Supabase Storage
const CACHE_DIR = path.resolve(process.env.UPLOAD_DIR || "storage/uploads");
const UA = { "User-Agent": "Mozilla/5.0 (InfoBanten migration)" };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

async function getJson(url: string): Promise<{ data: Json; headers: Headers }> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return { data: await res.json(), headers: res.headers };
    } catch (err) {
      if (attempt >= 4) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function getAll(endpoint: string, extra = ""): Promise<Json[]> {
  const out: Json[] = [];
  for (let page = 1; ; page++) {
    const { data, headers } = await getJson(`${API}/${endpoint}?per_page=100&page=${page}${extra}`);
    out.push(...data);
    const totalPages = Number(headers.get("x-wp-totalpages") || 1);
    if (page >= totalPages) break;
  }
  return out;
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (queue.length) await fn(queue.shift() as T);
    }),
  );
}

const uploadsPrefix = `${SOURCE}/wp-content/uploads/`;
function relUpload(url: string) {
  const u = url.replace(/^http:/, "https:");
  const prefix = uploadsPrefix.replace(/^http:/, "https:");
  return u.startsWith(prefix) ? decodeURI(u.slice(prefix.length).split("?")[0]) : null;
}

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".mp4": "video/mp4" };

/** Ambil file dari WordPress (atau cache lokal) lalu simpan ke penyimpanan tujuan. Mengembalikan ukuran byte. */
async function download(rel: string): Promise<number | null> {
  const cached = path.join(CACHE_DIR, rel);
  let data: Buffer | null = null;
  try {
    data = await fs.readFile(cached);
  } catch {
    const res = await fetch(uploadsPrefix + encodeURI(rel), { headers: UA });
    if (!res.ok) {
      console.warn(`  ! gagal unduh ${rel} (${res.status})`);
      return null;
    }
    data = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(cached), { recursive: true });
    await fs.writeFile(cached, data);
  }
  if (usingSupabase() && !(await fileExists(rel))) {
    await putFile(rel, data, MIME[path.extname(rel).toLowerCase()] ?? "application/octet-stream");
  }
  return data.length;
}

/** Ganti URL absolut domain lama menjadi path relatif, supaya konten jalan di domain mana pun. */
function rewriteContent(html: string) {
  const host = SOURCE.replace(/^https?:\/\//, "").replace(/\./g, "\\.");
  return html.replace(new RegExp(`https?://(www\\.)?${host}(?=/|"|')`, "g"), "");
}

const decode = (s: string) => he.decode(s || "");

async function scrapeSeo(link: string) {
  try {
    const res = await fetch(link, { headers: UA });
    const html = await res.text();
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    return { title: decode(title), description: decode(desc) };
  } catch {
    return { title: "", description: "" };
  }
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("Set ADMIN_PASSWORD di .env sebelum import.");

  console.log(`Sumber: ${SOURCE}`);
  console.log(`Penyimpanan file: ${usingSupabase() ? `Supabase Storage (bucket ${process.env.SUPABASE_BUCKET || "uploads"})` : CACHE_DIR}`);
  await ensureBucket();
  // Laman (Tentang, Kontak, Podcast, Beranda) sekarang ditulis langsung di kode — hanya berita yang diimpor
  const [categories, tags, users, media, posts] = await Promise.all([
    getAll("categories"),
    getAll("tags"),
    getAll("users"),
    getAll("media"),
    getAll("posts"),
  ]);
  console.log(
    `Ditemukan: ${posts.length} post, ${categories.length} kategori, ${tags.length} tag, ${media.length} media, ${users.length} user`,
  );

  // Bersihkan data lama agar import bisa diulang (idempoten)
  await prisma.$transaction([
    prisma.postTerm.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.term.deleteMany(),
    prisma.media.deleteMany(),
  ]);

  // Users
  for (const u of users) {
    const isAdmin = u.slug === "admin";
    const password = isAdmin ? adminPassword : crypto.randomBytes(12).toString("base64url");
    const data = {
      login: u.slug,
      email: u.name.includes("@") ? u.name : `${u.slug}@infobanten.my.id`,
      displayName: u.name,
      nicename: u.slug,
      role: "administrator",
      bio: u.description || "",
      passwordHash: await bcrypt.hash(password, 10),
    };
    await prisma.user.upsert({ where: { id: u.id }, create: { id: u.id, ...data }, update: data });
    if (!isAdmin) console.log(`  user ${u.slug} dibuat dengan password acak (reset lewat Users > Edit)`);
  }

  // Terms
  for (const t of categories)
    await prisma.term.create({
      data: { id: t.id, taxonomy: "category", name: decode(t.name), slug: t.slug, description: t.description || "", parentId: t.parent || null },
    });
  for (const t of tags)
    await prisma.term.create({
      data: { id: t.id, taxonomy: "post_tag", name: decode(t.name), slug: t.slug, description: t.description || "" },
    });

  // Media
  console.log("Mengunduh file media...");
  const extraFiles = new Set<string>();
  await pool(media, 6, async (m) => {
    const rel = relUpload(m.source_url);
    if (!rel) return;
    const fileSize = (await download(rel)) ?? 0;
    const sizes: Record<string, string> = {};
    for (const [name, s] of Object.entries<Json>(m.media_details?.sizes || {})) {
      const r = relUpload(s.source_url);
      if (r && r !== rel && (await download(r)) !== null) sizes[name] = r;
    }
    await prisma.media.create({
      data: {
        id: m.id,
        path: rel,
        mime: m.mime_type,
        width: m.media_details?.width ?? null,
        height: m.media_details?.height ?? null,
        fileSize,
        title: decode(m.title?.rendered),
        alt: m.alt_text || "",
        caption: decode((m.caption?.rendered || "").replace(/<[^>]+>/g, "").trim()),
        sizes: JSON.stringify(sizes),
        authorId: users.some((u: Json) => u.id === m.author) ? m.author : null,
        createdAt: new Date(m.date_gmt + "Z"),
      },
    });
  });

  // Berita
  console.log("Mengimpor berita...");
  const all = posts;
  const mediaIds = new Set(media.map((m: Json) => m.id));
  await pool(all, 4, async (p) => {
    const html = p.content.rendered as string;
    for (const m of html.matchAll(/https?:\/\/[^"'\s)]+\/wp-content\/uploads\/[^"'\s)]+/g)) {
      const rel = relUpload(m[0].replace(/&amp;/g, "&"));
      if (rel) extraFiles.add(rel);
    }
    const seo = await scrapeSeo(p.link);
    const excerpt = decode((p.excerpt?.rendered || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    await prisma.post.create({
      data: {
        id: p.id,
        type: p.type,
        status: p.status,
        slug: p.slug,
        title: decode(p.title.rendered),
        content: rewriteContent(html),
        excerpt: p.type === "post" ? excerpt.replace(/\s*\[(…|&hellip;|\.\.\.)\]$/, "") : "",
        seoTitle: seo.title,
        seoDescription: seo.description,
        sticky: !!p.sticky,
        commentStatus: p.comment_status,
        authorId: p.author || null,
        featuredId: mediaIds.has(p.featured_media) ? p.featured_media : null,
        publishedAt: new Date(p.date_gmt + "Z"),
        createdAt: new Date(p.date_gmt + "Z"),
        updatedAt: new Date(p.modified_gmt + "Z"),
        terms: {
          create: [...(p.categories || []), ...(p.tags || [])].map((termId: number) => ({ termId })),
        },
      },
    });
  });

  console.log(`Mengunduh ${extraFiles.size} file yang dirujuk di dalam konten...`);
  await pool([...extraFiles], 6, async (rel) => void (await download(rel)));

  // Komentar publik (jika ada)
  const comments = await getAll("comments");
  for (const c of comments) {
    if (!all.some((p) => p.id === c.post)) continue;
    await prisma.comment.create({
      data: {
        id: c.id,
        postId: c.post,
        parentId: c.parent || null,
        authorName: decode(c.author_name),
        authorEmail: "",
        authorUrl: c.author_url || "",
        content: c.content.rendered,
        status: "approved",
        createdAt: new Date(c.date_gmt + "Z"),
      },
    });
  }

  // Options bawaan (bisa diubah dari Settings)
  const { data: root } = await getJson(`${SOURCE}/wp-json/`);
  const defaults: Record<string, string> = {
    blogname: decode(root.name) || "infobanten.my.id",
    blogdescription:
      decode(root.description) ||
      "Dapatkan update berita terpercaya dan peristiwa penting di seputar Banten langsung di email Anda setiap hari.",
    posts_per_page: "10",
    default_category: "1",
    comment_moderation: "1",
    contact_phone: "0821-2127-3706",
    contact_whatsapp: "6282121273706",
  };
  for (const [key, value] of Object.entries(defaults))
    await prisma.option.upsert({ where: { key }, create: { key, value }, update: {} });

  // Postgres: majukan sequence autoincrement melewati ID WordPress agar data baru tidak bentrok
  for (const table of ["User", "Post", "Term", "Media", "Comment", "Subscriber", "Redirect"]) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM "${table}"), 0), 1), (SELECT MAX(id) FROM "${table}") IS NOT NULL)`,
    );
  }

  console.log(`Selesai: ${all.length} konten, ${media.length} media, ${comments.length} komentar.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
