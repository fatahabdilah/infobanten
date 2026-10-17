import type { Metadata } from "next";
import { getOptions } from "./site";

export const DEFAULT_OG_IMAGE = { url: "/images/og-default.jpg", width: 1200, height: 630, type: "image/jpeg" };

/** og:image versi 1200×630 JPEG terkompresi — ukuran kecil supaya pratinjau WhatsApp/Facebook selalu muncul */
export const ogImageFor = (postId: number, version: Date) => ({
  url: `/og/${postId}.jpg?v=${version.getTime().toString(36)}`,
  width: 1200,
  height: 630,
  type: "image/jpeg",
});

export async function pageMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  image?: { url: string; width: number; height: number; type: string };
  type?: "website" | "article";
  publishedTime?: Date;
  modifiedTime?: Date;
  section?: string;
  tags?: string[];
  noindex?: boolean;
}): Promise<Metadata> {
  const site = await getOptions();
  const description = opts.description || site.blogdescription;
  const image = { ...(opts.image ?? DEFAULT_OG_IMAGE), alt: opts.title };
  return {
    title: { absolute: opts.title },
    description,
    alternates: { canonical: opts.path },
    robots: opts.noindex ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      locale: "id_ID",
      siteName: site.blogname,
      url: opts.path,
      title: opts.title,
      description,
      type: opts.type ?? "website",
      images: [image],
      ...(opts.type === "article"
        ? {
            publishedTime: opts.publishedTime?.toISOString(),
            modifiedTime: opts.modifiedTime?.toISOString(),
            section: opts.section,
            tags: opts.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      images: [image.url],
    },
  };
}

export const withSiteName = async (title: string) => `${title} - ${(await getOptions()).blogname}`;
