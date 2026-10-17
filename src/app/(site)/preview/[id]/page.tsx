import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { can, getCurrentUser } from "@/lib/auth";
import { getContentById } from "@/lib/posts";
import SingularView from "@/components/site/SingularView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pratinjau", robots: { index: false, follow: false } };

/** Pratinjau draf (setara ?preview=true di WordPress) — hanya untuk pengguna yang login */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/wp-login.php?redirect_to=${encodeURIComponent(`/wp-admin/post.php?post=${id}&action=edit`)}`);
  const post = await getContentById(Number(id));
  if (!post || (post.authorId !== user.id && !can(user.role, "edit_others_posts"))) notFound();
  return (
    <>
      <div className="sticky top-0 z-40 bg-[#1d2327] px-4 py-2 text-center text-sm text-white">
        Mode pratinjau — {post.status === "publish" ? "versi tersimpan" : "draf ini belum diterbitkan"}.
      </div>
      <SingularView post={post} />
    </>
  );
}
