import type { Media } from "@prisma/client";

export const uploadUrl = (rel: string) => `/wp-content/uploads/${rel.split("/").map(encodeURIComponent).join("/")}`;

type SizeName = "thumbnail" | "medium" | "medium_large" | "large" | "full";

/** URL ukuran gambar terdekat (fallback ke ukuran asli), mirip wp_get_attachment_image_src */
export function mediaUrl(media: Pick<Media, "path" | "sizes"> | null | undefined, size: SizeName = "full") {
  if (!media) return null;
  if (size === "full") return uploadUrl(media.path);
  let sizes: Record<string, string> = {};
  try {
    sizes = JSON.parse(media.sizes || "{}");
  } catch {}
  const order: SizeName[] = ["thumbnail", "medium", "medium_large", "large"];
  for (const name of order.slice(order.indexOf(size))) if (sizes[name]) return uploadUrl(sizes[name]);
  return uploadUrl(media.path);
}

export function firstImageInContent(html: string) {
  return html.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null;
}
