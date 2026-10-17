import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

export type Role = "administrator" | "editor" | "author" | "contributor" | "subscriber";

export const ROLE_LABELS: Record<Role, string> = {
  administrator: "Administrator",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  subscriber: "Subscriber",
};

/** Kapabilitas disederhanakan dari peran WordPress */
const CAPS: Record<Role, string[]> = {
  administrator: ["read", "edit_posts", "publish_posts", "edit_others_posts", "edit_pages", "upload_files", "manage_categories", "moderate_comments", "list_users", "manage_options"],
  editor: ["read", "edit_posts", "publish_posts", "edit_others_posts", "edit_pages", "upload_files", "manage_categories", "moderate_comments"],
  author: ["read", "edit_posts", "publish_posts", "upload_files"],
  contributor: ["read", "edit_posts"],
  subscriber: ["read"],
};

export const can = (role: string, cap: string) => (CAPS[role as Role] ?? []).includes(cap);

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.uid } });
  // Session batal otomatis jika password diganti
  if (!user || user.passwordHash.slice(-12) !== session.pv) return null;
  return user;
});

export async function requireUser(cap = "read") {
  const user = await getCurrentUser();
  if (!user) redirect("/wp-login.php");
  if (!can(user.role, cap)) redirect("/wp-admin/?denied=1");
  return user;
}

export async function startSession(user: { id: number; passwordHash: string }, remember: boolean) {
  const maxAge = remember ? 60 * 60 * 24 * 14 : 60 * 60 * 24 * 2;
  const token = await signSession({ uid: user.id, pv: user.passwordHash.slice(-12) }, maxAge);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge } : {}),
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
