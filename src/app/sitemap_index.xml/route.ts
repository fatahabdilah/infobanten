import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { xmlResponse } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

// Struktur sama dengan sitemap Rank Math di WordPress lama
export async function GET() {
  const last = async (type: string) =>
    (await db.post.findFirst({ where: { type, status: "publish" }, orderBy: { updatedAt: "desc" } }))?.updatedAt ?? new Date();
  const maps = [
    ["post-sitemap.xml", await last("post")],
    ["page-sitemap.xml", await last("post")],
    ["category-sitemap.xml", await last("post")],
  ] as const;
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps
    .map(([f, d]) => `<sitemap><loc>${SITE_URL}/${f}</loc><lastmod>${d.toISOString()}</lastmod></sitemap>`)
    .join("\n")}\n</sitemapindex>`;
  return xmlResponse(body);
}
