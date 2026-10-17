"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";

export type LoginState = { error?: string; log?: string } | null;

// Batas percobaan login sederhana per IP (in-memory)
const attempts = new Map<string, { count: number; until: number }>();

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = ((await headers()).get("x-forwarded-for") || "local").split(",")[0].trim();
  const rec = attempts.get(ip);
  if (rec && rec.count >= 5 && rec.until > Date.now()) {
    return { error: "Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit." };
  }

  const log = String(formData.get("log") || "").trim();
  const pwd = String(formData.get("pwd") || "");
  const remember = formData.get("rememberme") === "forever";
  const redirectTo = String(formData.get("redirect_to") || "/wp-admin/");

  const user = log ? await db.user.findFirst({ where: { OR: [{ login: log }, { email: log.toLowerCase() }] } }) : null;
  const ok = user ? await bcrypt.compare(pwd, user.passwordHash) : false;
  if (!user || !ok) {
    const next = { count: (rec && rec.until > Date.now() ? rec.count : 0) + 1, until: Date.now() + 10 * 60 * 1000 };
    attempts.set(ip, next);
    return {
      log,
      error: !log || !pwd
        ? "Kolom nama pengguna dan kata sandi wajib diisi."
        : user
          ? `Kata sandi yang Anda masukkan untuk nama pengguna ${log} salah.`
          : `Nama pengguna ${log} tidak terdaftar di situs ini.`,
    };
  }
  attempts.delete(ip);
  await startSession(user, remember);
  redirect(redirectTo.startsWith("/wp-admin") ? redirectTo : "/wp-admin/");
}

export async function logout() {
  await endSession();
  redirect("/wp-login.php?loggedout=true");
}
