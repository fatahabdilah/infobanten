import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import MediaManager from "@/components/admin/MediaManager";

export const metadata: Metadata = { title: "Unggah Media Baru" };

export default async function MediaNewPage() {
  await requireUser("upload_files");
  return <MediaManager startWithUploader />;
}
