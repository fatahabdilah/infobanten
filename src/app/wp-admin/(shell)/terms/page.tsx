import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTerm, deleteTerms } from "@/app/actions/admin";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOptions } from "@/lib/site";
import { CheckAllScript, TablePages } from "@/components/admin/ListTable";
import TermForm from "@/components/admin/TermForm";

export const metadata: Metadata = { title: "Kategori" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };
const PER_PAGE = 20;

export default async function TermsPage({ searchParams }: Props) {
  await requireUser("manage_categories");
  const sp = await searchParams;
  const taxonomy = sp.taxonomy === "post_tag" ? "post_tag" : "category";
  const isCat = taxonomy === "category";
  const noun = isCat ? "Kategori" : "Tag";
  const base = `/wp-admin/edit-tags.php?taxonomy=${taxonomy}`;

  if (sp.action === "edit" && sp.tag_ID) {
    const term = await db.term.findUnique({ where: { id: Number(sp.tag_ID) } });
    if (!term || term.taxonomy !== taxonomy) notFound();
    const parents = await db.term.findMany({ where: { taxonomy: "category" }, orderBy: { name: "asc" } });
    return (
      <div className="wrap">
        <h1>Sunting {noun}</h1>
        <p className="mt-2"><Link href={base}>← Kembali ke {noun}</Link></p>
        <div className="max-w-[800px]">
          <TermForm taxonomy={taxonomy} parents={parents} term={term} />
        </div>
      </div>
    );
  }

  const s = sp.s?.trim();
  const page = Math.max(1, Number(sp.paged) || 1);
  const where = { taxonomy, ...(s ? { OR: [{ name: { contains: s, mode: "insensitive" as const } }, { slug: { contains: s, mode: "insensitive" as const } }] } : {}) };
  const [terms, total, parents, { defaultCategory }] = await Promise.all([
    db.term.findMany({
      where,
      include: { _count: { select: { posts: { where: { post: { status: { not: "trash" } } } } } } },
      orderBy: { name: "asc" },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
    db.term.count({ where }),
    db.term.findMany({ where: { taxonomy: "category" }, orderBy: { name: "asc" } }),
    getOptions(),
  ]);
  const parentName = new Map(parents.map((p) => [p.id, p.name]));
  const notice = sp.message === "2" ? `${noun} dihapus.` : sp.message === "3" ? `${noun} diperbarui.` : null;

  return (
    <div className="wrap">
      <h1 className="wp-heading-inline">{noun}</h1>
      {s && <span className="ml-2 text-[#646970]">Hasil pencarian untuk: <strong>{s}</strong></span>}
      <hr className="wp-header-end" />
      {notice && <div className="notice notice-success"><p>{notice}</p></div>}

      <div className="mt-2 flow-root">
        <form className="search-box" action="/wp-admin/edit-tags.php" method="get">
          <input type="hidden" name="taxonomy" value={taxonomy} />
          <input type="search" name="s" defaultValue={s} aria-label={`Cari ${noun}`} />
          <button className="button" type="submit">Cari {noun}</button>
        </form>
      </div>

      <div className="mt-3 flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-[35%]">
          <h2 className="mb-3 text-[1.3em] font-semibold text-[#1d2327]">Tambah {noun} Baru</h2>
          <TermForm taxonomy={taxonomy} parents={parents} />
        </div>
        <div className="min-w-0 flex-1">
          <form action={deleteTerms}>
            <input type="hidden" name="taxonomy" value={taxonomy} />
            <div className="tablenav top">
              <select name="action" defaultValue="delete" aria-label="Tindakan massal">
                <option value="delete">Hapus</option>
              </select>
              <button type="submit" className="button">Terapkan</button>
              <TablePages total={total} page={page} perPage={PER_PAGE} href={(n) => `${base}${s ? `&s=${encodeURIComponent(s)}` : ""}&paged=${n}`} />
            </div>
            <table className="wp-list-table">
              <thead>
                <tr>
                  <td className="check-column"><input type="checkbox" data-check-all aria-label="Pilih Semua" /></td>
                  <th scope="col">Nama</th>
                  <th scope="col" className="hidden md:table-cell">Deskripsi</th>
                  <th scope="col">Slug</th>
                  <th scope="col" className="w-[74px] text-center">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {terms.length === 0 && <tr className="no-items"><td colSpan={5}>Tidak ada {noun.toLowerCase()} yang ditemukan.</td></tr>}
                {terms.map((t) => {
                  const isDefault = isCat && t.id === defaultCategory;
                  return (
                    <tr key={t.id}>
                      <th scope="row" className="check-column">
                        {!isDefault && <input type="checkbox" name="delete_tags[]" value={t.id} aria-label={`Pilih ${t.name}`} />}
                      </th>
                      <td>
                        <strong>
                          <Link className="row-title" href={`${base}&action=edit&tag_ID=${t.id}`}>
                            {t.parentId && parentName.get(t.parentId) ? "— " : ""}
                            {t.name}
                          </Link>
                        </strong>
                        <div className="row-actions">
                          <span><Link href={`${base}&action=edit&tag_ID=${t.id}`}>Sunting</Link> | </span>
                          {!isDefault && (
                            <span className="delete">
                              <ConfirmButton formAction={deleteTerm.bind(null, t.id, taxonomy)} message={`Anda akan menghapus “${t.name}” secara permanen.\n‘Batal’ untuk berhenti, ‘OK’ untuk menghapus.`}>Hapus</ConfirmButton> |{" "}
                            </span>
                          )}
                          <span><a href={`/${isCat ? "category" : "tag"}/${t.slug}/`} target="_blank" rel="noopener">Lihat</a></span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">{t.description || <span aria-hidden>—</span>}</td>
                      <td>{t.slug}</td>
                      <td className="text-center">
                        <Link href={`/wp-admin/edit.php?${isCat ? `cat=${t.id}` : `tag=${t.slug}`}`}>{t._count.posts}</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </form>
          {isCat && (
            <p className="description mt-3">
              Menghapus kategori tidak menghapus pos di dalamnya. Pos yang hanya ada di kategori yang dihapus akan dipindah ke kategori default.
            </p>
          )}
        </div>
      </div>
      <CheckAllScript name="delete_tags[]" />
    </div>
  );
}
