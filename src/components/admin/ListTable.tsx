import Link from "next/link";

/** Paginasi tabel bergaya WordPress: "64 item « ‹ 1 dari 4 › »" */
export function TablePages({ total, page, perPage, href, unit = "item" }: { total: number; page: number; perPage: number; href: (n: number) => string; unit?: string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const nav = (n: number, label: string, disabled: boolean, title: string) =>
    disabled ? (
      <span className="tablenav-pages-navspan" aria-hidden>{label}</span>
    ) : (
      <Link className="button" href={href(n)} title={title}>
        {label}
      </Link>
    );
  return (
    <div className="tablenav-pages">
      <span className="displaying-num">
        {total} {unit}
      </span>
      {pages > 1 && (
        <>
          {nav(1, "«", page <= 1, "Halaman pertama")}
          {nav(page - 1, "‹", page <= 1, "Halaman sebelumnya")}
          <span className="px-1">
            {page} dari {pages}
          </span>
          {nav(page + 1, "›", page >= pages, "Halaman berikutnya")}
          {nav(pages, "»", page >= pages, "Halaman terakhir")}
        </>
      )}
    </div>
  );
}

export function SubSubSub({ items }: { items: { label: string; count: number; href: string; current: boolean }[] }) {
  return (
    <ul className="subsubsub">
      {items.map((it, i) => (
        <li key={it.href}>
          {i > 0 && " | "}
          <Link href={it.href} className={it.current ? "current" : ""} aria-current={it.current ? "page" : undefined}>
            {it.label} <span className="count">({it.count})</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Kotak centang "pilih semua" — script kecil tanpa JS bundel */
export function CheckAllScript({ name }: { name: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.querySelectorAll('[data-check-all]').forEach(function(c){c.addEventListener('change',function(){document.querySelectorAll('input[name="${name}"]').forEach(function(i){i.checked=c.checked});document.querySelectorAll('[data-check-all]').forEach(function(o){o.checked=c.checked})})});`,
      }}
    />
  );
}
