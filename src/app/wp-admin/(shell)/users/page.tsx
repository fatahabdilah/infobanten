import type { Metadata } from "next";
import Link from "next/link";
import { deleteUserById } from "@/app/actions/admin";
import { requireUser, ROLE_LABELS, type Role } from "@/lib/auth";
import { db } from "@/lib/db";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { Avatar } from "@/components/admin/icons";
import { SubSubSub } from "@/components/admin/ListTable";

export const metadata: Metadata = { title: "Pengguna" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function UsersPage({ searchParams }: Props) {
  const me = await requireUser("list_users");
  const sp = await searchParams;
  const role = sp.role;
  const s = sp.s?.trim();
  const [users, counts] = await Promise.all([
    db.user.findMany({
      where: { ...(role ? { role } : {}), ...(s ? { OR: [{ login: { contains: s, mode: "insensitive" as const } }, { email: { contains: s, mode: "insensitive" as const } }, { displayName: { contains: s, mode: "insensitive" as const } }] } : {}) },
      include: { _count: { select: { posts: { where: { type: "post", status: { not: "trash" } } } } } },
      orderBy: { login: "asc" },
    }),
    db.user.groupBy({ by: ["role"], _count: true }),
  ]);
  const total = counts.reduce((a, c) => a + c._count, 0);

  return (
    <div className="wrap">
      <h1 className="wp-heading-inline">Pengguna</h1>
      <Link href="/wp-admin/user-new.php" className="page-title-action">Tambah Pengguna</Link>
      <hr className="wp-header-end" />
      {sp.update === "add" && <div className="notice notice-success"><p>Pengguna baru dibuat.</p></div>}
      {sp.update === "del" && <div className="notice notice-success"><p>Pengguna dihapus.</p></div>}

      <div className="mt-2 flow-root">
        <SubSubSub
          items={[
            { label: "Semua", count: total, href: "/wp-admin/users.php", current: !role },
            ...counts.map((c) => ({ label: ROLE_LABELS[c.role as Role] ?? c.role, count: c._count, href: `/wp-admin/users.php?role=${c.role}`, current: role === c.role })),
          ]}
        />
        <form className="search-box" action="/wp-admin/users.php" method="get">
          <input type="search" name="s" defaultValue={s} aria-label="Cari Pengguna" />
          <button className="button" type="submit">Cari Pengguna</button>
        </form>
      </div>

      <form>
        <div className="tablenav top" />
        <table className="wp-list-table">
          <thead>
            <tr>
              <th scope="col">Nama Pengguna</th>
              <th scope="col" className="hidden md:table-cell">Nama</th>
              <th scope="col" className="hidden md:table-cell">Email</th>
              <th scope="col">Peran</th>
              <th scope="col" className="w-[80px] text-center">Pos</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const edit = u.id === me.id ? "/wp-admin/profile.php" : `/wp-admin/user-edit.php?user_id=${u.id}`;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="flex gap-2.5">
                      <Avatar name={u.displayName} size={32} />
                      <div>
                        <strong><Link href={edit}>{u.login}</Link></strong>
                        <div className="row-actions">
                          <span><Link href={edit}>Sunting</Link></span>
                          {u.id !== me.id && (
                            <span className="delete">
                              {" | "}
                              <ConfirmButton
                                formAction={deleteUserById.bind(null, u.id)}
                                message={`Hapus pengguna ${u.login}? Semua tulisannya akan dialihkan ke akun Anda.`}
                              >
                                Hapus
                              </ConfirmButton>
                            </span>
                          )}
                          <span> | <a href={`/author/${u.nicename}/`} target="_blank" rel="noopener">Lihat</a></span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">{u.displayName}</td>
                  <td className="hidden md:table-cell"><a href={`mailto:${u.email}`}>{u.email}</a></td>
                  <td>{ROLE_LABELS[u.role as Role] ?? u.role}</td>
                  <td className="text-center">
                    {u._count.posts > 0 ? <Link href={`/wp-admin/edit.php?author=${u.id}`}>{u._count.posts}</Link> : 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>
    </div>
  );
}
