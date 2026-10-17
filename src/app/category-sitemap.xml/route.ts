import { getCategoriesWithCount } from "@/lib/posts";
import { urlset, xmlResponse } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const cats = await getCategoriesWithCount();
  return xmlResponse(urlset(cats.map((c) => ({ loc: `/category/${c.slug}/` }))));
}
