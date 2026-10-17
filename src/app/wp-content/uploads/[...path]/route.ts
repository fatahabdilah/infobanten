import path from "node:path";
import { redirect } from "next/navigation";
import { getFile, supabasePublicUrl, usingSupabase } from "@/lib/storage";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
};

/**
 * File upload dengan path WordPress: /wp-content/uploads/2026/10/foto.jpg
 * Dengan Supabase, permintaan ini biasanya sudah di-proxy oleh rewrite di next.config;
 * route ini hanya cadangan (redirect) atau penyaji file lokal saat development.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.map((p) => decodeURIComponent(p)).join("/");
  if (rel.includes("..")) return new Response("Not found", { status: 404 });
  if (usingSupabase()) redirect(supabasePublicUrl(rel));

  const data = await getFile(rel);
  if (!data) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(rel).toLowerCase()] ?? "application/octet-stream";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(type === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    },
  });
}
