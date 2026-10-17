import sharp from "sharp";
import { db } from "@/lib/db";
import { firstImageInContent } from "@/lib/media";
import { getFile } from "@/lib/storage";

/**
 * Gambar pratinjau link (og:image) 1200×630 JPEG.
 * WhatsApp hanya menampilkan thumbnail jika gambar kecil (< ~300 KB), jadi gambar unggulan
 * dikompres ulang di sini. Hasilnya di-cache CDN lewat header Cache-Control.
 */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const id = Number((await params).file.replace(/\.jpg$/, ""));
  const post = Number.isInteger(id) ? await db.post.findUnique({ where: { id }, include: { featured: true } }) : null;

  let source: Buffer | null = null;
  if (post?.status === "publish") {
    const rel = post.featured?.path ?? firstImageInContent(post.content)?.replace(/^.*\/wp-content\/uploads\//, "");
    if (rel) source = await getFile(decodeURIComponent(rel.split("?")[0]));
  }

  let body: Buffer | null = null;
  if (source) {
    try {
      body = await sharp(source)
        .rotate()
        .resize(1200, 630, { fit: "cover", position: "attention" })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    } catch {}
  }
  if (!body) {
    // Gambar default dari folder public (diambil via HTTP agar jalan juga di serverless)
    const res = await fetch(new URL("/images/og-default.jpg", req.url));
    body = Buffer.from(await res.arrayBuffer());
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}
