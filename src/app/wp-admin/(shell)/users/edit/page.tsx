import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import UserForm from "@/components/admin/UserForm";

export const metadata: Metadata = { title: "Sunting Pengguna" };

export default async function EditUserPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser("list_users");
  const id = Number((await searchParams).user_id);
  if (id === me.id) redirect("/wp-admin/profile.php");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();
  return (
    <div className="wrap">
      <h1 className="wp-heading-inline">Sunting Pengguna {user.login}</h1>
      <Link href="/wp-admin/user-new.php" className="page-title-action">Tambah Pengguna</Link>
      <p className="mt-2"><Link href="/wp-admin/users.php">← Kembali ke Pengguna</Link></p>
      <UserForm user={{ id: user.id, login: user.login, email: user.email, displayName: user.displayName, bio: user.bio, role: user.role }} canEditRole isSelf={false} />
    </div>
  );
}
