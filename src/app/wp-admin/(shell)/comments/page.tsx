import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { bulkComments, rowCommentAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAdminDate } from "@/lib/format";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { Avatar } from "@/components/admin/icons";
import { CheckAllScript, SubSubSub, TablePages } from "@/components/admin/ListTable";
import ReplyBox from "@/components/admin/ReplyBox";

export const metadata: Metadata = { title: "Komentar" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };
const PER_PAGE = 20;
const MAP: Record<string, string> = { moderated: "pending", approved: "approved", spam: "spam", trash: "trash" };

export default async function CommentsPage({ searchParams }: Props) {
  await requireUser("moderate_comments");
  const sp = await searchParams;
  const view = sp.comment_status && MAP[sp.comment_status] ? sp.comment_status : "all";
  const page = Math.max(1, Number(sp.paged) || 1);
  const postId = Number(sp.p) || undefined;
  const s = sp.s?.trim();

  const where: Prisma.CommentWhereInput = {
    status: view === "all" ? { in: ["approved", "pending"] } : MAP[view],
    ...(postId ? { postId } : {}),
    ...(s ? { OR: [{ content: { contains: s, mode: "insensitive" as const } }, { authorName: { contains: s, mode: "insensitive" as const } }, { authorEmail: { contains: s, mode: "insensitive" as const } }] } : {}),
  };
  const [rows, total, counts] = await Promise.all([
    db.comment.findMany({ where, include: { post: { select: { id: true, title: true, slug: true, _count: { select: { comments: true } } } } }, orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.comment.count({ where }),
    db.comment.groupBy({ by: ["status"], _count: true, where: postId ? { postId } : {} }),
  ]);
  const n = (st: string) => counts.find((c) => c.status === st)?._count ?? 0;
  const href = (v?: string) => `/wp-admin/edit-comments.php${v ? `?comment_status=${v}` : ""}`;
  const back = `/wp-admin/edit-comments.php?${new URLSearchParams(Object.entries({ comment_status: view === "all" ? "" : view, p: postId ? String(postId) : "", paged: page > 1 ? String(page) : "" }).filter(([, v]) => v)).toString()}`;

  const bulkOptions =
    view === "trash"
      ? [["untrash", "Pulihkan"], ["delete", "Hapus Permanen"]]
      : view === "spam"
        ? [["unspam", "Bukan Spam"], ["delete", "Hapus Permanen"]]
        : [["unapprove", "Tolak"], ["approve", "Setujui"], ["spam", "Tandai sebagai Spam"], ["trash", "Pindahkan ke Tong Sampah"]];

  return (
    <div className="wrap">
      <h1 className="wp-heading-inline">Komentar</h1>
      {postId && rows[0] && <span className="ml-2 text-[#646970]">pada “<Link href={`/wp-admin/post.php?post=${postId}&action=edit`}>{rows[0].post.title}</Link>”</span>}
      <hr className="wp-header-end" />

      <div className="mt-2 flow-root">
        <SubSubSub
          items={[
            { label: "Semua", count: n("approved") + n("pending"), href: href(), current: view === "all" },
            { label: "Tertunda", count: n("pending"), href: href("moderated"), current: view === "moderated" },
            { label: "Disetujui", count: n("approved"), href: href("approved"), current: view === "approved" },
            { label: "Spam", count: n("spam"), href: href("spam"), current: view === "spam" },
            { label: "Sampah", count: n("trash"), href: href("trash"), current: view === "trash" },
          ]}
        />
        <form className="search-box" action="/wp-admin/edit-comments.php" method="get">
          {view !== "all" && <input type="hidden" name="comment_status" value={view} />}
          <input type="search" name="s" defaultValue={s} aria-label="Cari Komentar" />
          <button className="button" type="submit">Cari Komentar</button>
        </form>
      </div>

      <form action={bulkComments}>
        <input type="hidden" name="_back" value={back} />
        <div className="tablenav top">
          <select name="action" defaultValue="" aria-label="Tindakan massal">
            <option value="">Tindakan Massal</option>
            {bulkOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="submit" className="button">Terapkan</button>
          <TablePages total={total} page={page} perPage={PER_PAGE} href={(p) => `${back}${back.includes("?") ? "&" : "?"}paged=${p}`} />
        </div>
        <table className="wp-list-table">
          <thead>
            <tr>
              <td className="check-column"><input type="checkbox" data-check-all aria-label="Pilih Semua" /></td>
              <th scope="col" className="w-[20%]">Penulis</th>
              <th scope="col">Komentar</th>
              <th scope="col" className="hidden w-[20%] md:table-cell">Sebagai Tanggapan Untuk</th>
              <th scope="col" className="hidden w-[14%] lg:table-cell">Dikirim Pada</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr className="no-items"><td colSpan={5}>Tidak ada komentar yang ditemukan.</td></tr>}
            {rows.map((c) => {
              const pending = c.status === "pending";
              const act = (a: string) => rowCommentAction.bind(null, c.id, a, back);
              return (
                <tr key={c.id} className={pending ? "!bg-[#fcf9e8] [&>th:first-child]:shadow-[inset_4px_0_0_#d63638]" : ""}>
                  <th scope="row" className="check-column"><input type="checkbox" name="delete_comments[]" value={c.id} aria-label={`Pilih komentar ${c.authorName}`} /></th>
                  <td>
                    <div className="flex gap-2">
                      <Avatar name={c.authorName} size={32} />
                      <div className="min-w-0 break-words">
                        <strong className="text-[#1d2327]">{c.authorName}</strong>
                        {c.authorUrl && <a href={c.authorUrl} target="_blank" rel="nofollow noopener" className="block truncate">{c.authorUrl.replace(/^https?:\/\//, "")}</a>}
                        {c.authorEmail && <a href={`mailto:${c.authorEmail}`} className="block truncate">{c.authorEmail}</a>}
                        {c.authorIp && <span className="block text-[#646970]">{c.authorIp}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="lg:hidden text-[#646970]">{formatAdminDate(c.createdAt)}</div>
                    <div className="text-[#3c434a] [&_p]:my-1" dangerouslySetInnerHTML={{ __html: c.content }} />
                    <div className="row-actions flex flex-wrap gap-x-1">
                      {c.status === "trash" ? (
                        <>
                          <span><button type="submit" formAction={act("untrash")}>Pulihkan</button> | </span>
                          <span className="delete"><ConfirmButton formAction={act("delete")} message="Hapus komentar ini secara permanen?">Hapus Permanen</ConfirmButton></span>
                        </>
                      ) : c.status === "spam" ? (
                        <>
                          <span><button type="submit" formAction={act("unspam")}>Bukan Spam</button> | </span>
                          <span className="delete"><ConfirmButton formAction={act("delete")} message="Hapus komentar ini secara permanen?">Hapus Permanen</ConfirmButton></span>
                        </>
                      ) : (
                        <>
                          {pending ? (
                            <span><button type="submit" formAction={act("approve")} className="!text-[#007017]">Setujui</button> | </span>
                          ) : (
                            <span><button type="submit" formAction={act("unapprove")} className="!text-[#996800]">Tolak</button> | </span>
                          )}
                          <span><ReplyBox postId={c.post.id} parentId={c.id} approveLabel={pending} /> | </span>
                          <span className="spam"><button type="submit" formAction={act("spam")}>Spam</button> | </span>
                          <span className="trash"><button type="submit" formAction={act("trash")}>Buang</button></span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <Link href={`/wp-admin/post.php?post=${c.post.id}&action=edit`} className="font-semibold">{c.post.title}</Link>
                    <br />
                    <a href={`/${c.post.slug}/#comment-${c.id}`} target="_blank" rel="noopener">Lihat Pos</a>
                  </td>
                  <td className="hidden lg:table-cell">{formatAdminDate(c.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>
      <CheckAllScript name="delete_comments[]" />
    </div>
  );
}
