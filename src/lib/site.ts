import { cache } from "react";
import { db } from "./db";

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export { NAV_ITEMS } from "./nav";

export const getOptions = cache(async () => {
  const rows = await db.option.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    blogname: map.blogname || "infobanten.my.id",
    blogdescription:
      map.blogdescription ||
      "Dapatkan update berita terpercaya dan peristiwa penting di seputar Banten langsung di email Anda setiap hari.",
    postsPerPage: Number(map.posts_per_page) || 10,
    commentModeration: map.comment_moderation !== "0",
    contactPhone: map.contact_phone || "0821-2127-3706",
    contactWhatsapp: map.contact_whatsapp || "6282121273706",
    defaultCategory: Number(map.default_category) || 1,
  };
});

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);
