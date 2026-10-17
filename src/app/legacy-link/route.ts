import { db } from "@/lib/db";

// ID laman di WordPress lama (sekarang halaman statis di kode)
const WP_PAGES: Record<number, string> = { 1227: "/", 1228: "/tentang/", 1226: "/kontak/", 1229: "/podcast/" };

/** Tautan lama WordPress /?p=123 dan /?page_id=123 → 301 ke permalink */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("p") || url.searchParams.get("page_id"));
  if (WP_PAGES[id]) return Response.redirect(new URL(WP_PAGES[id], url), 301);
  const post = id ? await db.post.findUnique({ where: { id }, select: { slug: true, status: true } }) : null;
  if (post?.status === "publish") return Response.redirect(new URL(`/${post.slug}/`, url), 301);
  return Response.redirect(new URL("/", url), 302);
}
