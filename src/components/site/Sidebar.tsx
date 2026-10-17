/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { categoryUrl, getCategoriesWithCount, getRecentPosts } from "@/lib/posts";
import SubscribeForm from "./SubscribeForm";

const WidgetTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-heading text-[22px] font-bold leading-[27.5px] text-body">{children}</h2>
);

/** Sidebar arsip (Figma 192:5620) */
export default async function Sidebar() {
  const [categories, recent] = await Promise.all([getCategoriesWithCount(), getRecentPosts(5)]);
  return (
    <aside className="flex flex-col gap-[44.8px] lg:border-l lg:border-line-strong lg:pl-[60px]">
      <section>
        <WidgetTitle>Categories</WidgetTitle>
        <ul className="pt-[44.8px]">
          {categories.map((c) => (
            <li key={c.slug} className="pt-1 first:pt-0">
              <Link href={categoryUrl(c.slug)} className="text-base leading-8 text-heading hover:text-primary">
                {c.name}
              </Link>
              <span className="text-base leading-8 text-body"> ({c.count})</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <WidgetTitle>Subscribe</WidgetTitle>
        <div className="pt-[44.8px]">
          <SubscribeForm variant="sidebar" />
        </div>
      </section>

      <img src="/images/ad-sidebar.png" alt="Iklan" width={287} height={574} loading="lazy" className="h-auto w-full max-w-[287px]" />

      <section>
        <WidgetTitle>Recent Post</WidgetTitle>
        <ul className="pt-[44.8px]">
          {recent.map((p) => (
            <li key={p.id} className="pt-3 first:pt-0">
              <Link href={p.url} className="text-base leading-8 text-heading hover:text-primary">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <form action="/" method="get" role="search" className="flex h-[48.4px]">
        <input
          type="search"
          name="s"
          placeholder="search.."
          aria-label="Cari"
          className="min-w-12 flex-1 rounded-[2px] border border-line-strong bg-page px-2.5 text-base text-heading outline-none placeholder:text-[#757575] focus:border-primary"
        />
        <button type="submit" aria-label="Cari" className="ml-2.5 flex w-[58px] items-center justify-center rounded-[25px] border border-primary bg-primary">
          <img src="/images/icon-search-white.svg" alt="" width={24} height={24} />
        </button>
      </form>
    </aside>
  );
}
