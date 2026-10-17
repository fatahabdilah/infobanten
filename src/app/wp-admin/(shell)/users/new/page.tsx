import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import UserForm from "@/components/admin/UserForm";

export const metadata: Metadata = { title: "Tambah Pengguna" };

export default async function NewUserPage() {
  await requireUser("list_users");
  return (
    <div className="wrap">
      <h1>Tambah Pengguna</h1>
      <p className="mt-2">Buat pengguna baru dan tambahkan mereka ke situs ini.</p>
      <UserForm canEditRole isSelf={false} />
    </div>
  );
}
