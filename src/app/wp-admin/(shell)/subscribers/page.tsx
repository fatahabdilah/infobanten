import type { Metadata } from "next";
import { deleteSubscribers } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAdminDate } from "@/lib/format";
import { CheckAllScript, TablePages } from "@/components/admin/ListTable";

export const metadata: Metadata = { title: "Pelanggan" };
const PER_PAGE = 50;

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("moderate_comments");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.paged) || 1);
  const s = sp.s?.trim();
  const where = s ? { email: { contains: s, mode: "insensitive" as const } } : {};
  const [rows, total] = await Promise.all([
    db.subscriber.findMany({ where, orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.subscriber.count({ where }),
  ]);
  return (
    <div className="wrap">
      <h1 className="wp-heading-inline">Pelanggan Berita</h1>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- unduhan file CSV, bukan navigasi */}
      <a href="/wp-admin/subscribers-export/" className="page-title-action">Ekspor CSV</a>
      <hr className="wp-header-end" />
      {sp.deleted && <div className="notice notice-success"><p>{sp.deleted} pelanggan dihapus.</p></div>}
      <p className="mt-2 text-[#646970]">Email yang mendaftar lewat formulir “Langganan Berita Terbaru” di situs.</p>
      <div className="mt-2 flow-root">
        <form className="search-box" action="/wp-admin/subscribers/" method="get">
          <input type="search" name="s" defaultValue={s} aria-label="Cari email" />
          <button className="button" type="submit">Cari</button>
        </form>
      </div>
      <form action={deleteSubscribers}>
        <div className="tablenav top">
          <button type="submit" className="button">Hapus yang dipilih</button>
          <TablePages total={total} page={page} perPage={PER_PAGE} href={(n) => `/wp-admin/subscribers/?paged=${n}`} />
        </div>
        <table className="wp-list-table">
          <thead>
            <tr>
              <td className="check-column"><input type="checkbox" data-check-all aria-label="Pilih Semua" /></td>
              <th scope="col">Email</th>
              <th scope="col" className="w-[30%]">Tanggal Daftar</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr className="no-items"><td colSpan={3}>Belum ada pelanggan.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="check-column"><input type="checkbox" name="subscriber[]" value={r.id} aria-label={`Pilih ${r.email}`} /></th>
                <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                <td>{formatAdminDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
      <CheckAllScript name="subscriber[]" />
    </div>
  );
}
