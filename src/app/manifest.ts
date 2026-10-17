import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Info Banten",
    short_name: "Info Banten",
    description: "Berita terpercaya dan peristiwa penting di seputar Banten.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#0274be",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
