import { getPosts } from "@/lib/posts";
import { getOptions, SITE_URL } from "@/lib/site";
import { xmlEscape } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ posts }, site] = await Promise.all([getPosts({ take: 20, excerptWords: 55 }), getOptions()]);
  const items = posts
    .map(
      (p) => `<item>
<title>${xmlEscape(p.title)}</title>
<link>${SITE_URL}${p.url}</link>
<guid isPermaLink="false">${SITE_URL}/?p=${p.id}</guid>
<pubDate>${p.date.toUTCString()}</pubDate>
<dc:creator><![CDATA[${p.author}]]></dc:creator>
${p.categories.map((c) => `<category><![CDATA[${c.name}]]></category>`).join("")}
<description><![CDATA[${p.excerpt}]]></description>
${p.imageLarge ? `<enclosure url="${xmlEscape(SITE_URL + p.imageLarge)}" type="image/jpeg" length="0" />` : ""}
</item>`,
    )
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xmlEscape(site.blogname)}</title>
<atom:link href="${SITE_URL}/feed/" rel="self" type="application/rss+xml" />
<link>${SITE_URL}</link>
<description>${xmlEscape(site.blogdescription)}</description>
<language>id</language>
${items}
</channel>
</rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=UTF-8" } });
}
