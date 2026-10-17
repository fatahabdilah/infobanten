import type { Metadata } from "next";
import PostEditor from "@/components/admin/editor/PostEditor";
import { loadEditor } from "../load";

export const metadata: Metadata = { title: "Tambah Pos" };

export default async function NewPost() {
  const props = await loadEditor({});
  return <PostEditor key="new" {...props} />;
}
