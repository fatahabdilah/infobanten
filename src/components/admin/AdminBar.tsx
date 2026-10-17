"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import { Avatar, Dashicon } from "./icons";

export default function AdminBar({
  siteName,
  displayName,
  pendingComments,
  canEdit,
}: {
  siteName: string;
  displayName: string;
  pendingComments: number;
  canEdit: boolean;
}) {
  const [menu, setMenu] = useState<string | null>(null);
  const item = "flex h-[46px] items-center gap-1.5 px-2 text-[13px] !text-[#f0f0f1] no-underline hover:bg-[#2c3338] hover:!text-[#72aee6] md:h-8";

  return (
    <div className="fixed inset-x-0 top-0 z-[99999] flex h-[46px] bg-[#1d2327] text-[#f0f0f1] md:h-8" onMouseLeave={() => setMenu(null)}>
      <button
        type="button"
        className="flex w-[52px] items-center justify-center text-[#a7aaad] md:hidden"
        aria-label="Menu"
        onClick={() => window.dispatchEvent(new Event("wpa-toggle-menu"))}
      >
        <svg width="26" height="26" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M3 15h14v-2H3v2Zm0-4h14V9H3v2Zm0-6v2h14V5H3Z" />
        </svg>
      </button>
      <Link href="/wp-admin/" className={`${item} px-[7px]`} title="Dasbor">
        <img src="/images/logo.png" alt="" width={20} height={20} className="size-5 rounded-full bg-white" />
      </Link>
      <div className="relative" onMouseEnter={() => setMenu("site")}>
        <Link href="/" className={item}>
          <Dashicon name="home" className="text-[#a7aaad]" />
          <span className="hidden sm:inline">{siteName}</span>
        </Link>
        {menu === "site" && (
          <ul className="absolute left-0 top-full min-w-40 bg-[#2c3338] py-1.5 shadow-lg">
            <li>
              <Link href="/" className="block px-3 py-1 text-[13px] !text-[#f0f0f1] no-underline hover:!text-[#72aee6]">
                Kunjungi Situs
              </Link>
            </li>
          </ul>
        )}
      </div>
      {canEdit && (
        <Link href="/wp-admin/edit-comments.php?comment_status=moderated" className={item} title={`${pendingComments} komentar menunggu moderasi`}>
          <Dashicon name="comments" className="text-[#a7aaad]" />
          <span>{pendingComments}</span>
        </Link>
      )}
      <div className="relative" onMouseEnter={() => setMenu("new")}>
        <Link href="/wp-admin/post-new.php" className={item}>
          <Dashicon name="plus" className="text-[#a7aaad]" />
          <span className="hidden sm:inline">Baru</span>
        </Link>
        {menu === "new" && (
          <ul className="absolute left-0 top-full min-w-40 bg-[#2c3338] py-1.5 shadow-lg">
            {[
              ["Pos", "/wp-admin/post-new.php"],
              ["Media", "/wp-admin/media-new.php"],
              ["Pengguna", "/wp-admin/user-new.php"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="block px-3 py-1 text-[13px] !text-[#f0f0f1] no-underline hover:!text-[#72aee6]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative ml-auto" onMouseEnter={() => setMenu("me")}>
        <Link href="/wp-admin/profile.php" className={item}>
          <span className="hidden sm:inline">Halo, {displayName}</span>
          <Avatar name={displayName} size={18} />
        </Link>
        {menu === "me" && (
          <div className="absolute right-0 top-full flex w-60 gap-3 bg-[#2c3338] p-3 shadow-lg">
            <Avatar name={displayName} size={64} />
            <ul className="text-[13px]">
              <li className="pb-1 text-[#f0f0f1]">{displayName}</li>
              <li>
                <Link href="/wp-admin/profile.php" className="block py-1 !text-[#f0f0f1] no-underline hover:!text-[#72aee6]">
                  Sunting Profil
                </Link>
              </li>
              <li>
                <form action={logout}>
                  <button type="submit" className="py-1 text-[#f0f0f1] hover:text-[#72aee6]">
                    Log Keluar
                  </button>
                </form>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
