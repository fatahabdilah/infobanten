import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import MediaManager from "@/components/admin/MediaManager";

export const metadata: Metadata = { title: "Pustaka Media" };

export default async function MediaPage() {
  await requireUser("upload_files");
  return <MediaManager />;
}
