import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { bulkPosts, rowPostAction } from "@/app/actions/admin";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAdminDate } from "@/lib/format";
import { CheckAllScript, SubSubSub, TablePages } from "@/components/admin/ListTable";
import ConfirmButton from "@/components/admin/ConfirmButton";

export const metadata: Metadata = { title: "Pos" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };
const PER_PAGE = 20;

const STATUS_LABEL: Record<string, string> = { publish: "Terbit", draft: "Draf", pending: "Tertunda", private: "Privat", trash: "Sampah" };

export default async function PostsList({ searchParams }: Props) {
  const sp = await searchParams;
  const type = "post";
  const user = await requireUser("edit_posts");
  const status = sp.post_status;
  const page = Math.max(1, Number(sp.paged) || 1);
  const s = sp.s?.trim();
  const cat = Number(sp.cat) || undefined;
  const authorFilter = Number(sp.author) || undefined;
  const orderby = sp.orderby === "title" ? "title" : "publishedAt";
  const order: "asc" | "desc" = sp.order === "asc" ? "asc" : orderby === "title" && !sp.order ? "asc" : (sp.order as "asc" | "desc") || "desc";
  const label = "Pos";

  const base: Prisma.PostWhereInput = { type, ...(can(user.role, "edit_others_posts") ? {} : { authorId: user.id }) };
  const where: Prisma.PostWhereInput = {
    ...base,
    status: status === "future" ? "publish" : status ? status : { not: "trash" },
    ...(status === "future" ? { publishedAt: { gt: new Date() } } : {}),
    ...(s ? { OR: [{ title: { contains: s, mode: "insensitive" as const } }, { content: { contains: s, mode: "insensitive" as const } }] } : {}),
    ...(cat ? { terms: { some: { termId: cat } } } : {}),
    ...(sp.tag ? { terms: { some: { term: { slug: sp.tag, taxonomy: "post_tag" } } } } : {}),
    ...(authorFilter ? { authorId: authorFilter } : {}),
  };

  const [rows, total, counts, categories] = await Promise.all([
    db.post.findMany({
      where,
      include: { author: true, terms: { include: { term: true } }, _count: { select: { comments: true } } },
      orderBy: { [orderby]: order },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
    db.post.count({ where }),
    db.post.groupBy({ by: ["status"], where: base, _count: true }),
    db.term.findMany({ where: { taxonomy: "category" }, orderBy: { name: "asc" } }),
  ]);
  const futureCount = await db.post.count({ where: { ...base, status: "publish", publishedAt: { gt: new Date() } } });
  const count = (st: string) => counts.find((c) => c.status === st)?._count ?? 0;
  const allCount = counts.filter((c) => c.status !== "trash").reduce((a, c) => a + c._count, 0);

  const qs = (extra: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = {
      post_status: status,
      s,
      cat,
      author: authorFilter,
      orderby: sp.orderby,
      order: sp.order,
      ...extra,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v === undefined || v === "") continue;
      if (k === "paged" && Number(v) <= 1) continue;
      p.set(k, String(v));
    }
    const str = p.toString();
    return `/wp-admin/edit.php${str ? `?${str}` : ""}`;
  };
  const filterBase = (st?: string) => {
    const p = new URLSearchParams();
    if (st) p.set("post_status", st);
    return `/wp-admin/edit.php${p.toString() ? `?${p}` : ""}`;
  };
  const back = qs({});
  const sortLink = (col: string) => qs({ orderby: col, order: orderby === col && order === "asc" ? "desc" : "asc", paged: undefined });
  const newHref = "/wp-admin/post-new.php";

  const filters = [
    { label: "Semua", count: allCount, href: filterBase(), current: !status },
    ...(["publish", "future", "draft", "pending", "private", "trash"] as const)
      .map((st) => ({ st, n: st === "future" ? futureCount : count(st) }))
      .filter(({ n }) => n > 0)
      .map(({ st, n }) => ({
        label:
          st === "future"
            ? "Terjadwal"
            : st === "publish"
              ? "Terbit"
              : st === "draft"
                ? "Draf"
                : st === "pending"
                  ? "Tertunda"
                  : st === "private"
                    ? "Privat"
                    : "Sampah",
        count: n,
        href: filterBase(st),
        current: status === st,
      })),
  ];

  const notice = sp.trashed
    ? `${sp.trashed} ${label.toLowerCase()} dipindahkan ke Tong Sampah.`
    : sp.untrashed
      ? `${sp.untrashed} ${label.toLowerCase()} dipulihkan dari Tong Sampah.`
      : sp.deleted
        ? `${sp.deleted} ${label.toLowerCase()} dihapus secara permanen.`
        : sp.updated
          ? `${sp.updated} ${label.toLowerCase()} diperbarui.`
          : null;
  const colspan = 7;
  const inTrash = status === "trash";

  return (
    <div className="wrap">
      <h1 className="wp-heading-inline">{label}</h1>
      <Link href={newHref} className="page-title-action">
        Tambah {label}
      </Link>
      {s && (
        <span className="ml-2 text-[#646970]">
          Hasil pencarian untuk: <strong>{s}</strong>
        </span>
      )}
      <hr className="wp-header-end" />
      {notice && (
        <div className="notice notice-success">
          <p>{notice}</p>
        </div>
      )}

      <div className="mt-2 flow-root">
        <SubSubSub items={filters} />
        <form className="search-box" action="/wp-admin/edit.php" method="get">
          {status && <input type="hidden" name="post_status" value={status} />}
          <label htmlFor="post-search-input" className="sr-only">
            Cari {label}
          </label>
          <input type="search" id="post-search-input" name="s" defaultValue={s} />
          <button className="button" type="submit">
            Cari {label}
          </button>
        </form>
      </div>

      <form action={bulkPosts}>
        <input type="hidden" name="_back" value={back} />
        <div className="tablenav top flex-wrap !h-auto">
          <select name="action" defaultValue="-1" aria-label="Pilih tindakan massal">
            <option value="-1">Tindakan Massal</option>
            {inTrash ? (
              <>
                <option value="untrash">Pulihkan</option>
                <option value="delete">Hapus Permanen</option>
              </>
            ) : (
              <>
                {can(user.role, "publish_posts") && <option value="publish">Terbitkan</option>}
                <option value="draft">Jadikan Draf</option>
                <option value="trash">Pindahkan ke Tong Sampah</option>
              </>
            )}
          </select>
          <button type="submit" className="button">
            Terapkan
          </button>
          <>
            <select name="cat" defaultValue={cat ?? ""} aria-label="Saring menurut kategori" form="filter-form">
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="button" form="filter-form">
              Saring
            </button>
          </>
          {inTrash && count("trash") > 0 && (
            <button
              type="submit"
              name="action"
              value="delete"
              className="button"
              formAction={async (fd: FormData) => {
                "use server";
                const ids = (await db.post.findMany({ where: { ...base, status: "trash" }, select: { id: true } })).map((p) => p.id);
                ids.forEach((id) => fd.append("post[]", String(id)));
                fd.set("action", "delete");
                await bulkPosts(fd);
              }}
            >
              Kosongkan Tong Sampah
            </button>
          )}
          <TablePages total={total} page={page} perPage={PER_PAGE} href={(n) => qs({ paged: n })} />
        </div>

        <table className="wp-list-table">
          <thead>
            <tr>
              <td className="check-column">
                <input type="checkbox" data-check-all aria-label="Pilih Semua" />
              </td>
              <th scope="col" className="w-[40%]">
                <Link href={sortLink("title")}>Judul {orderby === "title" ? (order === "asc" ? "▲" : "▼") : ""}</Link>
              </th>
              <th scope="col" className="hidden w-[12%] md:table-cell">
                Penulis
              </th>
              <th scope="col" className="hidden w-[15%] md:table-cell">
                Kategori
              </th>
              <th scope="col" className="hidden w-[12%] lg:table-cell">
                Tag
              </th>
              <th scope="col" className="hidden w-[5.5em] md:table-cell" title="Komentar">
                💬
              </th>
              <th scope="col" className="w-[14%]">
                <Link href={sortLink("publishedAt")}>Tanggal {orderby === "publishedAt" ? (order === "asc" ? "▲" : "▼") : ""}</Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="no-items">
                <td colSpan={colspan}>
                  Tidak ada {label.toLowerCase()} yang ditemukan{inTrash ? " di Tong Sampah" : ""}.
                </td>
              </tr>
            )}
            {rows.map((p) => {
              const cats = p.terms.filter((t) => t.term.taxonomy === "category");
              const tags = p.terms.filter((t) => t.term.taxonomy === "post_tag");
              const scheduled = p.status === "publish" && p.publishedAt > new Date();
              const states = [
                p.status === "draft" && "Draf",
                p.status === "pending" && "Tertunda",
                p.status === "private" && "Privat",
                scheduled && "Terjadwal",
                p.sticky && "Lekat",
              ].filter(Boolean);
              const editHref = `/wp-admin/post.php?post=${p.id}&action=edit`;
              return (
                <tr key={p.id}>
                  <th scope="row" className="check-column">
                    <input type="checkbox" name="post[]" value={p.id} aria-label={`Pilih ${p.title}`} />
                  </th>
                  <td>
                    <strong>
                      {inTrash ? (
                        <span className="row-title">{p.title || "(tanpa judul)"}</span>
                      ) : (
                        <Link className="row-title" href={editHref}>
                          {p.title || "(tanpa judul)"}
                        </Link>
                      )}
                      {states.length > 0 && <span className="post-state"> — {states.join(", ")}</span>}
                    </strong>
                    <div className="row-actions">
                      {inTrash ? (
                        <>
                          <span>
                            <button type="submit" formAction={rowPostAction.bind(null, p.id, "untrash", back)}>
                              Pulihkan
                            </button>{" "}
                            |{" "}
                          </span>
                          <span className="delete">
                            <ConfirmButton
                              formAction={rowPostAction.bind(null, p.id, "delete", back)}
                              message={`Hapus “${p.title || "(tanpa judul)"}” secara permanen? Tindakan ini tidak bisa dibatalkan.`}
                            >
                              Hapus Permanen
                            </ConfirmButton>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            <Link href={editHref}>Sunting</Link> |{" "}
                          </span>
                          <span className="trash">
                            <button type="submit" formAction={rowPostAction.bind(null, p.id, "trash", back)}>
                              Buang
                            </button>{" "}
                            |{" "}
                          </span>
                          <span>
                            <a href={p.status === "publish" ? `/${p.slug}/` : `/preview/${p.id}/`} target="_blank" rel="noopener">
                              {p.status === "publish" && !scheduled ? "Lihat" : "Pratinjau"}
                            </a>
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <Link href={qs({ author: p.authorId ?? undefined, paged: undefined })}>{p.author?.displayName ?? "—"}</Link>
                  </td>
                  <td className="hidden md:table-cell">
                    {cats.length
                      ? cats.map((t, i) => (
                          <span key={t.termId}>
                            {i > 0 && ", "}
                            <Link href={qs({ cat: t.termId, paged: undefined })}>{t.term.name}</Link>
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td className="hidden lg:table-cell">
                    {tags.length
                      ? tags.map((t, i) => (
                          <span key={t.termId}>
                            {i > 0 && ", "}
                            <Link href={`/wp-admin/edit.php?tag=${t.term.slug}`}>{t.term.name}</Link>
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td className="hidden md:table-cell">
                    {p._count.comments > 0 ? (
                      <Link
                        href={`/wp-admin/edit-comments.php?p=${p.id}`}
                        className="inline-block min-w-6 rounded-[3px] bg-[#646970] px-1.5 text-center text-white no-underline hover:bg-[#2271b1] hover:text-white"
                      >
                        {p._count.comments}
                      </Link>
                    ) : (
                      <span className="text-[#a7aaad]">—</span>
                    )}
                  </td>
                  <td>
                    {scheduled ? "Terjadwal" : p.status === "publish" ? "Diterbitkan" : "Terakhir Diubah"}
                    <br />
                    {formatAdminDate(p.status === "publish" ? p.publishedAt : p.updatedAt)}
                    <div className="text-[#646970] md:hidden">{STATUS_LABEL[p.status]}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="check-column">
                <input type="checkbox" data-check-all aria-label="Pilih Semua" />
              </td>
              <th scope="col">Judul</th>
              <th scope="col" className="hidden md:table-cell">
                Penulis
              </th>
              <th scope="col" className="hidden md:table-cell">
                Kategori
              </th>
              <th scope="col" className="hidden lg:table-cell">
                Tag
              </th>
              <th scope="col" className="hidden md:table-cell">
                💬
              </th>
              <th scope="col">Tanggal</th>
            </tr>
          </tfoot>
        </table>
        <div className="tablenav bottom">
          <TablePages total={total} page={page} perPage={PER_PAGE} href={(n) => qs({ paged: n })} />
        </div>
      </form>
      <form id="filter-form" action="/wp-admin/edit.php" method="get">
        {status && <input type="hidden" name="post_status" value={status} />}
        {s && <input type="hidden" name="s" value={s} />}
      </form>
      <CheckAllScript name="post[]" />
    </div>
  );
}
