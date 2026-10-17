import "server-only";
import path from "node:path";
import sharp from "sharp";
import { db } from "./db";
import { deleteFiles, fileExists, getFile, putFile } from "./storage";

export const ALLOWED_MIME = /^(image\/(jpeg|png|gif|webp|avif|svg\+xml)|application\/pdf|video\/(mp4|webm)|audio\/mpeg)$/;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// Ukuran gambar bawaan WordPress
const SIZES = [
  { name: "thumbnail", w: 150, h: 150, crop: true },
  { name: "medium", w: 300, h: 300, crop: false },
  { name: "medium_large", w: 768, h: 0, crop: false },
  { name: "large", w: 1024, h: 1024, crop: false },
] as const;
const BIG_IMAGE_THRESHOLD = 2560;

export function sanitizeFileName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path
    .basename(name, path.extname(name))
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
  return { base: base || "file", ext };
}

export function validateUpload(mime: string, size: number) {
  if (!ALLOWED_MIME.test(mime)) throw new Error(`Tipe file "${mime || "tidak dikenal"}" tidak diizinkan.`);
  if (size > MAX_UPLOAD_BYTES) throw new Error("Ukuran file melebihi batas 20 MB.");
}

/** Simpan file seperti WordPress: folder tahun/bulan, nama unik, ukuran thumbnail/medium/large */
export async function processUpload(input: Buffer, fileName: string, mime: string, authorId: number | null) {
  validateUpload(mime, input.length);
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { base: rawBase, ext } = sanitizeFileName(fileName);
  let base = rawBase;
  for (let i = 1; await fileExists(`${dir}/${base}${ext}`); i++) base = `${rawBase}-${i}`;

  let buffer = input;
  let width: number | null = null;
  let height: number | null = null;
  const sizes: Record<string, string> = {};
  const isRaster = /^image\/(jpeg|png|webp|avif|gif)$/.test(mime);

  if (isRaster) {
    const meta = await sharp(buffer).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
    // Seperti WP 5.3+: gambar sangat besar disimpan aslinya + versi "-scaled" yang dipakai
    if (mime !== "image/gif" && width && height && Math.max(width, height) > BIG_IMAGE_THRESHOLD) {
      await putFile(`${dir}/${base}${ext}`, buffer, mime);
      buffer = await sharp(buffer).rotate().resize(BIG_IMAGE_THRESHOLD, BIG_IMAGE_THRESHOLD, { fit: "inside" }).toBuffer();
      const m2 = await sharp(buffer).metadata();
      width = m2.width ?? width;
      height = m2.height ?? height;
      base = `${base}-scaled`;
    }
  }

  const rel = `${dir}/${base}${ext}`;
  await putFile(rel, buffer, mime);

  if (isRaster && mime !== "image/gif" && width && height) {
    for (const s of SIZES) {
      if (width <= s.w && (s.h === 0 || height <= s.h)) continue;
      const img = sharp(buffer).rotate();
      const resized = s.crop ? img.resize(s.w, s.h, { fit: "cover" }) : img.resize(s.w, s.h || undefined, { fit: "inside", withoutEnlargement: true });
      const { data, info } = await resized.toBuffer({ resolveWithObject: true });
      const sizeRel = `${dir}/${base}-${info.width}x${info.height}${ext}`;
      await putFile(sizeRel, data, mime);
      sizes[s.name] = sizeRel;
    }
  }

  return db.media.create({
    data: {
      path: rel,
      mime,
      width,
      height,
      fileSize: buffer.length,
      title: rawBase.replace(/[-_]+/g, " "),
      sizes: JSON.stringify(sizes),
      authorId,
    },
  });
}

export async function saveUpload(file: File, authorId: number | null) {
  validateUpload(file.type, file.size);
  return processUpload(Buffer.from(await file.arrayBuffer()), file.name, file.type, authorId);
}

/** Selesaikan unggahan langsung: file sementara di tmp/ diproses lalu dihapus */
export async function finalizeTempUpload(tmpRel: string, fileName: string, mime: string, authorId: number | null) {
  if (!/^tmp\/[\w-]+\/[^/]+$/.test(tmpRel)) throw new Error("Path unggahan tidak valid.");
  const data = await getFile(tmpRel);
  if (!data) throw new Error("File unggahan tidak ditemukan.");
  try {
    return await processUpload(data, fileName, mime, authorId);
  } finally {
    await deleteFiles([tmpRel]);
  }
}

export async function deleteUploadFiles(media: { path: string; sizes: string }) {
  let sizes: Record<string, string> = {};
  try {
    sizes = JSON.parse(media.sizes);
  } catch {}
  await deleteFiles([media.path, ...Object.values(sizes)]);
}
