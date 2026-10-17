import type { NextConfig } from "next";

// URL admin bergaya WordPress (/wp-admin/edit.php, dst.) dipetakan ke route internal.
const adminAliases: Record<string, string> = {
  "edit.php": "posts",
  "post-new.php": "editor/new",
  "post.php": "editor/edit",
  "edit-tags.php": "terms",
  "upload.php": "media",
  "media-new.php": "media/new",
  "edit-comments.php": "comments",
  "users.php": "users",
  "user-new.php": "users/new",
  "user-edit.php": "users/edit",
  "profile.php": "profile",
  "options-general.php": "settings",
  "index.php": "",
};

const nextConfig: NextConfig = {
  // WordPress memakai trailing slash (/slug/) — dipertahankan agar URL identik
  trailingSlash: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
  },
  async rewrites() {
    // File upload dilayani langsung dari Supabase Storage dengan URL WordPress yang sama
    const supabase = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const bucket = process.env.SUPABASE_BUCKET || "uploads";
    const beforeFiles = supabase
      ? [{ source: "/wp-content/uploads/:path*", destination: `${supabase}/storage/v1/object/public/${bucket}/:path*` }]
      : [];
    return {
      beforeFiles: [
        ...beforeFiles,
        // Pencarian & tautan lama WordPress tetap di URL yang sama, tapi beranda bisa di-cache
        { source: "/", has: [{ type: "query", key: "s" }], destination: "/search-results/" },
        { source: "/", has: [{ type: "query", key: "p" }], destination: "/legacy-link/" },
        { source: "/", has: [{ type: "query", key: "page_id" }], destination: "/legacy-link/" },
      ],
      afterFiles: [
      { source: "/wp-login.php", destination: "/wp-login/" },
      ...Object.entries(adminAliases).map(([from, to]) => ({
        source: `/wp-admin/${from}`,
        destination: `/wp-admin/${to}${to ? "/" : ""}`,
      })),
      { source: "/feed", destination: "/feed.xml" },
      { source: "/feed/", destination: "/feed.xml" },
      ],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/wp-sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
      { source: "/sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
      { source: "/beranda/", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
