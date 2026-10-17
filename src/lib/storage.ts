/**
 * Penyimpanan file upload (path relatif seperti "2026/10/foto.jpg").
 * - Supabase Storage bila SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY diisi (production)
 * - Folder lokal UPLOAD_DIR sebagai cadangan (development tanpa Supabase)
 * Dipakai juga oleh scripts/import-wp.ts, jadi jangan import "server-only" di sini.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

export const BUCKET = process.env.SUPABASE_BUCKET || "uploads";
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "storage/uploads");

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = () => Boolean(SUPABASE_URL && SERVICE_KEY);

let client: SupabaseClient | null = null;
function sb() {
  if (!usingSupabase()) throw new Error("Supabase Storage belum dikonfigurasi");
  client ??= createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

const encodePath = (rel: string) => rel.split("/").map(encodeURIComponent).join("/");

/** URL publik file di Supabase (dipakai rewrite /wp-content/uploads/* di next.config) */
export const supabasePublicUrl = (rel: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodePath(rel)}`;

function localPath(rel: string) {
  const file = path.resolve(UPLOAD_DIR, rel);
  if (!file.startsWith(UPLOAD_DIR + path.sep)) throw new Error("Path tidak valid");
  return file;
}

export async function putFile(rel: string, data: Buffer | Uint8Array, contentType: string) {
  if (usingSupabase()) {
    const { error } = await sb().storage.from(BUCKET).upload(rel, data, { contentType, upsert: true, cacheControl: "31536000" });
    if (error) throw new Error(`Gagal menyimpan ${rel}: ${error.message}`);
    return;
  }
  const file = localPath(rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

export async function getFile(rel: string): Promise<Buffer | null> {
  if (usingSupabase()) {
    const { data, error } = await sb().storage.from(BUCKET).download(rel);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  try {
    return await fs.readFile(localPath(rel));
  } catch {
    return null;
  }
}

export async function fileExists(rel: string) {
  if (usingSupabase()) {
    const dir = path.posix.dirname(rel);
    const name = path.posix.basename(rel);
    const { data } = await sb().storage.from(BUCKET).list(dir === "." ? "" : dir, { search: name, limit: 100 });
    return !!data?.some((f) => f.name === name);
  }
  try {
    await fs.access(localPath(rel));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFiles(rels: string[]) {
  if (!rels.length) return;
  if (usingSupabase()) {
    await sb().storage.from(BUCKET).remove(rels);
    return;
  }
  for (const rel of rels) await fs.unlink(localPath(rel)).catch(() => {});
}

/** URL bertanda tangan untuk unggah langsung dari browser (melewati batas body 4,5 MB di Vercel) */
export async function createUploadUrl(rel: string) {
  const { data, error } = await sb().storage.from(BUCKET).createSignedUploadUrl(rel, { upsert: false });
  if (error || !data) throw new Error(error?.message || "Gagal membuat URL unggah");
  // anon key bersifat publik; dikirim agar gateway Supabase menerima permintaan dari browser
  return { signedUrl: data.signedUrl, path: data.path, anonKey: process.env.SUPABASE_ANON_KEY || "" };
}

/** Pastikan bucket publik tersedia (dipanggil saat import) */
export async function ensureBucket() {
  if (!usingSupabase()) return;
  const { data } = await sb().storage.getBucket(BUCKET);
  if (data) {
    if (!data.public) await sb().storage.updateBucket(BUCKET, { public: true });
    return;
  }
  const { error } = await sb().storage.createBucket(BUCKET, { public: true, fileSizeLimit: 25 * 1024 * 1024 });
  if (error && !/already exists/i.test(error.message)) throw new Error(`Gagal membuat bucket: ${error.message}`);
}
