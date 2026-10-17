"use client";

import { useActionState, useState } from "react";
import { saveUser, type UserState } from "@/app/actions/admin";

type U = { id: number; login: string; email: string; displayName: string; bio: string; role: string };

const ROLES = [
  ["subscriber", "Subscriber"],
  ["contributor", "Contributor"],
  ["author", "Author"],
  ["editor", "Editor"],
  ["administrator", "Administrator"],
];

function generatePassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
  const arr = new Uint32Array(20);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export default function UserForm({ user, canEditRole, isSelf }: { user?: U; canEditRole: boolean; isSelf: boolean }) {
  const [state, action, pending] = useActionState<UserState, FormData>(saveUser, null);
  const [pass, setPass] = useState(user ? "" : generatePassword());
  const [showPass, setShowPass] = useState(!user);
  const strength = pass.length >= 14 && /[^A-Za-z0-9]/.test(pass) ? "Kuat" : pass.length >= 10 ? "Sedang" : pass ? "Lemah" : "";

  return (
    <form action={action} autoComplete="off">
      {user && <input type="hidden" name="user_id" value={user.id} />}
      {state && (
        <div className={`notice ${state.ok ? "notice-success" : "notice-error"}`}>
          <p>{state.message}</p>
        </div>
      )}
      <h2 className="mt-6 text-[1.3em] font-semibold text-[#1d2327]">Nama</h2>
      <table className="form-table">
        <tbody>
          <tr>
            <th scope="row"><label htmlFor="user_login">Nama Pengguna {!user && <span className="text-[#646970]">(wajib)</span>}</label></th>
            <td>
              <input id="user_login" name="user_login" type="text" className="regular-text" defaultValue={user?.login} disabled={!!user} required={!user} />
              {user && <p className="description">Nama pengguna tidak bisa diubah.</p>}
            </td>
          </tr>
          {canEditRole && !isSelf && (
            <tr>
              <th scope="row"><label htmlFor="role">Peran</label></th>
              <td>
                <select id="role" name="role" defaultValue={user?.role ?? "author"}>
                  {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </td>
            </tr>
          )}
          <tr>
            <th scope="row"><label htmlFor="display_name">Nama Tampilan</label></th>
            <td>
              <input id="display_name" name="display_name" type="text" className="regular-text" defaultValue={user?.displayName} />
              <p className="description">Nama yang ditampilkan sebagai penulis berita.</p>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-6 text-[1.3em] font-semibold text-[#1d2327]">Info Kontak</h2>
      <table className="form-table">
        <tbody>
          <tr>
            <th scope="row"><label htmlFor="email">Email <span className="text-[#646970]">(wajib)</span></label></th>
            <td><input id="email" name="email" type="email" className="regular-text" defaultValue={user?.email} required /></td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-6 text-[1.3em] font-semibold text-[#1d2327]">{isSelf ? "Tentang Anda" : "Tentang Pengguna"}</h2>
      <table className="form-table">
        <tbody>
          <tr>
            <th scope="row"><label htmlFor="description">Info Biografis</label></th>
            <td>
              <textarea id="description" name="description" rows={5} className="large-text" defaultValue={user?.bio} />
              <p className="description">Isi sedikit info biografis untuk profil Anda. Ini bisa ditampilkan secara publik.</p>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-6 text-[1.3em] font-semibold text-[#1d2327]">Manajemen Akun</h2>
      <table className="form-table">
        <tbody>
          <tr>
            <th scope="row"><label htmlFor="pass1">{user ? "Kata Sandi Baru" : "Kata Sandi"}</label></th>
            <td>
              {!showPass ? (
                <button type="button" className="button" onClick={() => { setPass(generatePassword()); setShowPass(true); }}>
                  Atur Kata Sandi Baru
                </button>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input id="pass1" name="pass1" type="text" className="regular-text font-mono" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
                    <button type="button" className="button" onClick={() => setPass(generatePassword())}>Buat kata sandi</button>
                    {user && <button type="button" className="button" onClick={() => { setPass(""); setShowPass(false); }}>Batal</button>}
                  </div>
                  {strength && (
                    <p className={`mt-1 w-[25em] max-w-full px-2 py-1 text-center text-[13px] ${strength === "Kuat" ? "bg-[#b8e6bf]" : strength === "Sedang" ? "bg-[#f8dda7]" : "bg-[#f1adad]"}`}>{strength}</p>
                  )}
                  <p className="description">Minimal 8 karakter. Salin & simpan kata sandi ini sebelum menyimpan.</p>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4">
        <button type="submit" className="button button-primary" disabled={pending}>
          {user ? (isSelf ? "Perbarui Profil" : "Perbarui Pengguna") : "Tambah Pengguna Baru"}
        </button>
      </p>
    </form>
  );
}
