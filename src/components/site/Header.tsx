"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";

// Halaman dengan latar gradien penuh: header transparan di atas konten
const OVERLAY_PATHS = ["/", "/tentang/", "/kontak/"];

export default function Header() {
  const pathname = usePathname();
  const overlay = OVERLAY_PATHS.includes(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  return (
    <header className={`z-30 px-4 md:px-10 ${overlay ? "absolute inset-x-0 top-0" : "relative bg-white"}`}>
      <div className="mx-auto flex min-h-[80px] max-w-[1240px] items-center md:min-h-[122px] md:px-5">
        <Link href="/" className="shrink-0 pr-5" aria-label="Info Banten — Beranda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Info Banten" width={90} height={90} className="size-[64px] md:size-[90px]" />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden pl-2.5 lg:block">
          <ul className="flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex h-[100px] items-center pr-8 text-[13px] font-bold uppercase leading-[100px] transition-colors hover:text-primary ${
                    isActive(item.href) ? "text-primary" : "text-heading"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center">
          <Link
            href="#berlangganan"
            className="hidden pr-2.5 text-base font-bold leading-4 text-primary hover:text-primary-dark sm:block"
          >
            Berlangganan
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-[25.5px] items-center pl-[26px]"
            aria-label="Cari"
            aria-expanded={searchOpen}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/icon-search.svg" alt="" width={16.1953} height={18} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-4 flex size-10 items-center justify-center rounded bg-primary text-white lg:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              {menuOpen ? (
                <path d="M4.3 4.3a1 1 0 0 1 1.4 0L10 8.6l4.3-4.3a1 1 0 1 1 1.4 1.4L11.4 10l4.3 4.3a1 1 0 0 1-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 0 1-1.4-1.4L8.6 10 4.3 5.7a1 1 0 0 1 0-1.4Z" />
              ) : (
                <path d="M3 5h14a1 1 0 1 0 0-2H3a1 1 0 0 0 0 2Zm14 4H3a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2Zm0 6H3a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2Z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {searchOpen && (
        <form action="/" method="get" className="mx-auto -mt-4 flex max-w-[1200px] gap-2 pb-4">
          <input
            ref={searchRef}
            type="search"
            name="s"
            placeholder="Cari berita..."
            className="h-12 flex-1 rounded-[2px] border border-line-strong bg-white px-4 text-base text-heading outline-none focus:border-primary"
          />
          <button type="submit" className="h-12 rounded-[25px] bg-primary px-6 font-bold text-white">
            Cari
          </button>
        </form>
      )}

      {menuOpen && (
        <nav aria-label="Navigasi seluler" className="absolute inset-x-0 top-full bg-white shadow-lg lg:hidden">
          <ul className="divide-y divide-line">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-6 py-4 text-[13px] font-bold uppercase ${
                    isActive(item.href) ? "text-primary" : "text-heading"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="#berlangganan" className="block px-6 py-4 font-bold text-primary">
                Berlangganan
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
