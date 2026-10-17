import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/editor/PostEditor";
import { loadEditor } from "../load";

export const metadata: Metadata = { title: "Sunting Pos" };

export default async function EditPost({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const id = Number((await searchParams).post);
  if (!id) notFound();
  const props = await loadEditor({ id });
  return <PostEditor key={id} {...props} />;
}
