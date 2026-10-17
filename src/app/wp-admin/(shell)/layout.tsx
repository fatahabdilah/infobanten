import { Suspense } from "react";
import { can, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOptions } from "@/lib/site";
import AdminBar from "@/components/admin/AdminBar";
import AdminMenu from "@/components/admin/AdminMenu";

const ALL_CAPS = ["read", "edit_posts", "publish_posts", "edit_others_posts", "edit_pages", "upload_files", "manage_categories", "moderate_comments", "list_users", "manage_options"];

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const user = (await getCurrentUser())!;
  const [site, pending] = await Promise.all([getOptions(), db.comment.count({ where: { status: "pending" } })]);
  const caps = ALL_CAPS.filter((c) => can(user.role, c));

  return (
    <>
      <AdminBar siteName={site.blogname} displayName={user.displayName} pendingComments={pending} canEdit={can(user.role, "moderate_comments")} />
      <Suspense>
        <AdminMenu caps={caps} pendingComments={pending} />
      </Suspense>
      <div className="wpa-content ml-0 pt-[46px] md:ml-40 md:pt-8">
        <div className="px-2.5 md:pl-5 md:pr-0">{children}</div>
      </div>
    </>
  );
}
