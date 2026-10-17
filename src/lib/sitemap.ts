import { db } from "./db";
import { SITE_URL } from "./site";

export const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export const xmlResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": "application/xml; charset=UTF-8", "Cache-Control": "public, max-age=600" } });

export function urlset(entries: { loc: string; lastmod?: Date; image?: string | null }[]) {
  const items = entries
    .map(
      (e) =>
        `<url><loc>${xmlEscape(SITE_URL + e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}${
          e.image ? `<image:image><image:loc>${xmlEscape(SITE_URL + e.image)}</image:loc></image:image>` : ""
        }</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${items}\n</urlset>`;
}

export async function contentEntries() {
  const rows = await db.post.findMany({
    where: { type: "post", status: "publish", publishedAt: { lte: new Date() } },
    include: { featured: true },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map((r) => ({
    loc: `/${r.slug}/`,
    lastmod: r.updatedAt,
    image: r.featured ? `/wp-content/uploads/${r.featured.path}` : null,
  }));
}
