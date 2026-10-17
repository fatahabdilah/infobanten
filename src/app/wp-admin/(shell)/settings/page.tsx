import type { Metadata } from "next";
import { saveSettings } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOptions, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Pengaturan Umum" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("manage_options");
  const sp = await searchParams;
  const [o, cats] = await Promise.all([getOptions(), db.term.findMany({ where: { taxonomy: "category" }, orderBy: { name: "asc" } })]);

  return (
    <div className="wrap">
      <h1>Pengaturan Umum</h1>
      {sp["settings-updated"] && <div className="notice notice-success"><p><strong>Pengaturan disimpan.</strong></p></div>}
      <form action={saveSettings}>
        <table className="form-table">
          <tbody>
            <tr>
              <th scope="row"><label htmlFor="blogname">Judul Situs</label></th>
              <td><input id="blogname" name="blogname" type="text" className="regular-text" defaultValue={o.blogname} /></td>
            </tr>
            <tr>
              <th scope="row"><label htmlFor="blogdescription">Slogan</label></th>
              <td>
                <textarea id="blogdescription" name="blogdescription" rows={2} className="large-text" defaultValue={o.blogdescription} />
                <p className="description">Dalam beberapa kata, jelaskan tentang apa situs ini. Juga dipakai sebagai deskripsi default untuk Google & WhatsApp.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">Alamat Situs (URL)</th>
              <td>
                <input type="url" className="regular-text" value={SITE_URL} disabled readOnly />
                <p className="description">Diatur lewat variabel lingkungan <code>SITE_URL</code> di server.</p>
              </td>
            </tr>
            <tr>
              <th scope="row"><label htmlFor="contact_phone">Telepon Layanan</label></th>
              <td><input id="contact_phone" name="contact_phone" type="text" className="regular-text" defaultValue={o.contactPhone} /></td>
            </tr>
            <tr>
              <th scope="row"><label htmlFor="contact_whatsapp">Nomor WhatsApp Admin</label></th>
              <td>
                <input id="contact_whatsapp" name="contact_whatsapp" type="text" className="regular-text" defaultValue={o.contactWhatsapp} />
                <p className="description">Format internasional tanpa + atau spasi, contoh: 6282121273706. Dipakai tombol “Hubungi Admin”.</p>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-6 text-[1.3em] font-semibold text-[#1d2327]">Membaca & Menulis</h2>
        <table className="form-table">
          <tbody>
            <tr>
              <th scope="row"><label htmlFor="posts_per_page">Halaman blog menampilkan paling banyak</label></th>
              <td><input id="posts_per_page" name="posts_per_page" type="number" min={1} max={50} className="w-20" defaultValue={o.postsPerPage} /> pos</td>
            </tr>
            <tr>
              <th scope="row"><label htmlFor="default_category">Kategori Pos Default</label></th>
              <td>
                <select id="default_category" name="default_category" defaultValue={o.defaultCategory}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-6 text-[1.3em] font-semibold text-[#1d2327]">Diskusi</h2>
        <table className="form-table">
          <tbody>
            <tr>
              <th scope="row">Sebelum komentar tampil</th>
              <td>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="comment_moderation" defaultChecked={o.commentModeration} /> Komentar harus disetujui secara manual
                </label>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4"><button type="submit" className="button button-primary">Simpan Perubahan</button></p>
      </form>
    </div>
  );
}
