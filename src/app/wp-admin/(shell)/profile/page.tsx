import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import UserForm from "@/components/admin/UserForm";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const me = await requireUser();
  return (
    <div className="wrap">
      <h1>Profil</h1>
      <UserForm user={{ id: me.id, login: me.login, email: me.email, displayName: me.displayName, bio: me.bio, role: me.role }} canEditRole={false} isSelf />
    </div>
  );
}
