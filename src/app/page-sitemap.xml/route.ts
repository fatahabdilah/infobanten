import { urlset, xmlResponse } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

// Halaman statis (ditulis langsung di kode)
const STATIC_PAGES = ["/", "/tentang/", "/kontak/", "/podcast/"];

export async function GET() {
  return xmlResponse(urlset(STATIC_PAGES.map((loc) => ({ loc }))));
}
