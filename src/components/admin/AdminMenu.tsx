"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Dashicon } from "./icons";

type Item = {
  key: string;
  label: string;
  icon: string;
  href: string;
  cap: string;
  badge?: number;
  sub?: { label: string; href: string }[];
};

const A = "/wp-admin/";

export function buildMenu(pendingComments: number): Item[] {
  return [
    { key: "dashboard", label: "Dasbor", icon: "dashboard", href: A, cap: "read", sub: [{ label: "Beranda", href: A }] },
    {
      key: "posts",
      label: "Pos",
      icon: "posts",
      href: `${A}edit.php`,
      cap: "edit_posts",
      sub: [
        { label: "Semua Pos", href: `${A}edit.php` },
        { label: "Tambah Pos", href: `${A}post-new.php` },
        { label: "Kategori", href: `${A}edit-tags.php?taxonomy=category` },
        { label: "Tag", href: `${A}edit-tags.php?taxonomy=post_tag` },
      ],
    },
    {
      key: "media",
      label: "Media",
      icon: "media",
      href: `${A}upload.php`,
      cap: "upload_files",
      sub: [
        { label: "Pustaka", href: `${A}upload.php` },
        { label: "Tambah File Media Baru", href: `${A}media-new.php` },
      ],
    },
    { key: "comments", label: "Komentar", icon: "comments", href: `${A}edit-comments.php`, cap: "moderate_comments", badge: pendingComments },
    { key: "subscribers", label: "Pelanggan", icon: "email", href: `${A}subscribers/`, cap: "moderate_comments" },
    {
      key: "users",
      label: "Pengguna",
      icon: "users",
      href: `${A}users.php`,
      cap: "list_users",
      sub: [
        { label: "Semua Pengguna", href: `${A}users.php` },
        { label: "Tambah Pengguna", href: `${A}user-new.php` },
        { label: "Profil", href: `${A}profile.php` },
      ],
    },
    { key: "profile", label: "Profil", icon: "users", href: `${A}profile.php`, cap: "!list_users" },
    { key: "settings", label: "Pengaturan", icon: "settings", href: `${A}options-general.php`, cap: "manage_options", sub: [{ label: "Umum", href: `${A}options-general.php` }] },
  ];
}

function activeKey(path: string) {
  const file = path.replace(/^\/wp-admin\/?/, "").replace(/\/$/, "");
  if (file === "" || file === "index.php") return "dashboard";
  if (["edit.php", "post-new.php", "post.php"].includes(file)) return "posts";
  if (file === "edit-tags.php") return "posts";
  if (["upload.php", "media-new.php"].includes(file)) return "media";
  if (file === "edit-comments.php") return "comments";
  if (file === "subscribers") return "subscribers";
  if (["users.php", "user-new.php", "user-edit.php"].includes(file)) return "users";
  if (file === "profile.php") return "users|profile";
  if (file.startsWith("options")) return "settings";
  return "";
}

export default function AdminMenu({ caps, pendingComments }: { caps: string[]; pendingComments: number }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [folded, setFolded] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setMobileOpen((v) => !v);
    window.addEventListener("wpa-toggle-menu", toggle);
    return () => window.removeEventListener("wpa-toggle-menu", toggle);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname, sp]);

  useEffect(() => {
    try {
      setFolded(localStorage.getItem("wpa-folded") === "1");
    } catch {}
  }, []);

  const allowed = (cap: string) => (cap.startsWith("!") ? !caps.includes(cap.slice(1)) : caps.includes(cap));
  const items = buildMenu(pendingComments).filter((i) => allowed(i.cap));
  const active = activeKey(pathname);
  const current = pathname.replace(/\/$/, "") + (sp.toString() ? `?${sp.toString()}` : "");
  const isActive = (key: string) => active.split("|").includes(key);

  const subIsCurrent = (href: string) => {
    const [p, q] = href.split("?");
    const cleanP = p.replace(/\/$/, "");
    const [curP, curQ] = current.split("?");
    if (cleanP !== curP.replace(/\/$/, "") && !(cleanP === "/wp-admin" && curP === "/wp-admin/index.php")) return false;
    const want = new URLSearchParams(q);
    const have = new URLSearchParams(curQ);
    if (!q) return !have.get("taxonomy");
    return [...want.entries()].every(([k, v]) => have.get(k) === v);
  };

  function toggleFold() {
    setFolded((f) => {
      try {
        localStorage.setItem("wpa-folded", f ? "0" : "1");
      } catch {}
      return !f;
    });
  }

  return (
    <nav
      aria-label="Menu utama"
      className={`fixed bottom-0 left-0 top-[46px] z-[9990] overflow-y-auto bg-[#1d2327] md:top-8 md:block md:overflow-visible ${
        mobileOpen ? "block w-[190px]" : "hidden"
      } ${folded ? "md:w-9" : "md:w-40"}`}
    >
      <ul className="pt-3 pb-[180px]">
        {items.map((item) => {
          const on = isActive(item.key);
          const open = hover === item.key;
          return (
            <li
              key={item.key}
              className="relative"
              onMouseEnter={() => setHover(item.key)}
              onMouseLeave={() => setHover(null)}
            >
              <Link
                href={item.href}
                className={`flex min-h-[34px] items-center text-sm leading-[18px] no-underline ${
                  on ? "!bg-[#2271b1] !text-white" : open ? "!bg-[#2c3338] !text-[#72aee6]" : "!text-[#f0f0f1]"
                }`}
              >
                <span className={`flex w-9 shrink-0 justify-center ${on ? "text-white" : open ? "text-[#72aee6]" : "text-[#a7aaad]"}`}>
                  <Dashicon name={item.icon} />
                </span>
                {!folded && (
                  <span className="flex-1 py-2 pr-2">
                    {item.label}
                    {!!item.badge && (
                      <span className="ml-1 inline-block min-w-[18px] rounded-[9px] bg-[#d63638] px-[5px] text-center text-[9px] leading-[17px] text-white">
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </Link>
              {on && !folded && item.sub && (
                <ul className="bg-[#2c3338] py-[7px]">
                  {item.sub.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className={`block py-[5px] pl-9 pr-2 text-[13px] leading-[1.4] no-underline hover:!text-[#72aee6] ${
                          subIsCurrent(s.href) ? "font-semibold !text-white" : "!text-[rgba(240,246,252,0.7)]"
                        }`}
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {open && (!on || folded) && item.sub && (
                <ul className={`absolute top-0 z-10 min-w-40 bg-[#2c3338] py-[7px] shadow-[0_3px_5px_rgba(0,0,0,0.2)] ${folded ? "left-9" : "left-40"}`}>
                  {folded && <li className="px-3 pb-1 text-sm text-white">{item.label}</li>}
                  {item.sub.map((s) => (
                    <li key={s.href}>
                      <Link href={s.href} className="block px-3 py-[5px] text-[13px] !text-[rgba(240,246,252,0.7)] no-underline hover:!text-[#72aee6]">
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={toggleFold}
            className="flex min-h-[34px] w-full items-center text-left text-[13px] text-[#a7aaad] hover:text-[#72aee6]"
          >
            <span className={`flex w-9 shrink-0 justify-center ${folded ? "rotate-180" : ""}`}>
              <Dashicon name="collapse" />
            </span>
            {!folded && <span>Ciutkan menu</span>}
          </button>
        </li>
      </ul>
      <style>{`.wpa-content{margin-left:${folded ? 36 : 160}px}@media(max-width:781px){.wpa-content{margin-left:0}}`}</style>
    </nav>
  );
}
