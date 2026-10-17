import type { Metadata } from "next";
import Link from "next/link";
import { quickDraft } from "@/app/actions/admin";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAdminDate, stripTags, trimWords } from "@/lib/format";
import { Dashicon } from "@/components/admin/icons";

export const metadata: Metadata = { title: "Dasbor" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function Dashboard({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await requireUser();
  const [posts, comments, pending, subscribers, recent, drafts, recentComments] = await Promise.all([
    db.post.count({ where: { type: "post", status: "publish" } }),
    db.comment.count({ where: { status: "approved" } }),
    db.comment.count({ where: { status: "pending" } }),
    db.subscriber.count(),
    db.post.findMany({ where: { type: "post", status: "publish" }, orderBy: { publishedAt: "desc" }, take: 5 }),
    db.post.findMany({ where: { type: "post", status: "draft", authorId: user.id }, orderBy: { updatedAt: "desc" }, take: 3 }),
    db.comment.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { post: { select: { title: true, id: true } } } }),
  ]);
  const future = await db.post.findMany({ where: { type: "post", status: "publish", publishedAt: { gt: new Date() } }, orderBy: { publishedAt: "asc" }, take: 5 });

  return (
    <div className="wrap">
      <h1>Dasbor</h1>
      {sp.denied && (
        <div className="notice notice-error">
          <p>Maaf, Anda tidak diizinkan mengakses halaman tersebut.</p>
        </div>
      )}
      {sp.draft && (
        <div className="notice notice-success">
          <p>Draf disimpan.</p>
        </div>
      )}

      <div className="postbox mt-4 border-0 !bg-[#2271b1] !text-white">
        <div className="px-6 py-8 md:px-10">
          <h2 className="text-[28px] font-normal leading-tight">Selamat datang di Info Banten!</h2>
          <p className="mt-2 text-base opacity-90">Kelola berita, media, dan komentar dari satu tempat.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/wp-admin/post-new.php" className="button !border-white !bg-white !text-[#2271b1]">
              Tulis berita baru
            </Link>
            <Link href="/" className="button !border-white !bg-transparent !text-white" target="_blank">
              Lihat situs Anda
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="postbox">
            <h2 className="hndle">Sekilas</h2>
            <div className="inside">
              <ul className="grid grid-cols-2 gap-y-2">
                <li>
                  <Link href="/wp-admin/edit.php" className="flex items-center gap-1.5 no-underline">
                    <Dashicon name="posts" className="text-[#646970]" /> {posts} Pos
                  </Link>
                </li>
                <li>
                  <Link href="/wp-admin/edit-comments.php" className="flex items-center gap-1.5 no-underline">
                    <Dashicon name="comments" className="text-[#646970]" /> {comments} Komentar
                  </Link>
                </li>
                {pending > 0 && (
                  <li>
                    <Link href="/wp-admin/edit-comments.php?comment_status=moderated" className="flex items-center gap-1.5 text-[#d63638] no-underline">
                      <Dashicon name="comments" /> {pending} Menunggu moderasi
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/wp-admin/subscribers/" className="flex items-center gap-1.5 no-underline">
                    <Dashicon name="email" className="text-[#646970]" /> {subscribers} Pelanggan
                  </Link>
                </li>
              </ul>
              <p className="mt-3 border-t border-[#f0f0f1] pt-3 text-[#646970]">Next.js dengan tema Info Banten.</p>
            </div>
          </div>

          <div className="postbox">
            <h2 className="hndle">Aktivitas</h2>
            <div className="inside">
              {future.length > 0 && (
                <>
                  <h3 className="mb-2 text-sm font-normal text-[#646970]">Segera Diterbitkan</h3>
                  <ul className="mb-4 space-y-1">
                    {future.map((p) => (
                      <li key={p.id} className="flex gap-4">
                        <span className="w-[150px] shrink-0 text-[#646970]">{formatAdminDate(p.publishedAt)}</span>
                        <Link href={`/wp-admin/post.php?post=${p.id}&action=edit`}>{p.title || "(tanpa judul)"}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <h3 className="mb-2 text-sm font-normal text-[#646970]">Baru Diterbitkan</h3>
              <ul className="space-y-1">
                {recent.map((p) => (
                  <li key={p.id} className="flex gap-4">
                    <span className="w-[150px] shrink-0 text-[#646970]">{formatAdminDate(p.publishedAt)}</span>
                    <Link href={`/wp-admin/post.php?post=${p.id}&action=edit`} className="truncate">
                      {p.title || "(tanpa judul)"}
                    </Link>
                  </li>
                ))}
              </ul>
              <h3 className="mb-2 mt-4 text-sm font-normal text-[#646970]">Komentar Terbaru</h3>
              {recentComments.length === 0 ? (
                <p className="text-[#646970]">Belum ada komentar.</p>
              ) : (
                <ul className="divide-y divide-[#f0f0f1]">
                  {recentComments.map((c) => (
                    <li key={c.id} className={`py-2 ${c.status === "pending" ? "bg-[#fcf9e8] px-2" : ""}`}>
                      Dari <strong>{c.authorName}</strong> pada{" "}
                      <Link href={`/wp-admin/post.php?post=${c.post.id}&action=edit`}>{c.post.title}</Link>
                      {c.status === "pending" && <span className="ml-1 text-[#d63638]">[Menunggu]</span>}
                      <p className="text-[#50575e]">{trimWords(stripTags(c.content), 20)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div>
          {can(user.role, "edit_posts") && (
            <div className="postbox">
              <h2 className="hndle">Draf Cepat</h2>
              <div className="inside">
                <form action={quickDraft} className="space-y-3">
                  <div>
                    <label htmlFor="qd-title" className="mb-1 block">Judul</label>
                    <input id="qd-title" name="post_title" type="text" className="w-full" autoComplete="off" />
                  </div>
                  <div>
                    <label htmlFor="qd-content" className="mb-1 block">Konten</label>
                    <textarea id="qd-content" name="content" rows={4} placeholder="Apa yang ada di pikiran Anda?" className="w-full" />
                  </div>
                  <button type="submit" className="button button-primary">
                    Simpan Draf
                  </button>
                </form>
                {drafts.length > 0 && (
                  <div className="mt-4 border-t border-[#f0f0f1] pt-3">
                    <h3 className="mb-2 text-sm font-semibold">
                      Draf Anda <Link href="/wp-admin/edit.php?post_status=draft" className="ml-1 font-normal">Lihat semua draf</Link>
                    </h3>
                    <ul className="space-y-2">
                      {drafts.map((d) => (
                        <li key={d.id}>
                          <Link href={`/wp-admin/post.php?post=${d.id}&action=edit`}>{d.title || "(tanpa judul)"}</Link>{" "}
                          <span className="text-[#646970]">{formatAdminDate(d.updatedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="postbox">
            <h2 className="hndle">Tautan Cepat</h2>
            <div className="inside">
              <ul className="space-y-1.5">
                <li><Link href="/wp-admin/upload.php">Kelola media</Link></li>
                <li><Link href="/wp-admin/edit-tags.php?taxonomy=category">Kelola kategori</Link></li>
                <li><a href="/sitemap_index.xml" target="_blank">Lihat sitemap</a></li>
                <li><a href="/feed/" target="_blank">Lihat RSS feed</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
