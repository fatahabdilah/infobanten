import { can, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "moderate_comments")) return new Response("Forbidden", { status: 403 });
  const rows = await db.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  const csv = ["email,tanggal_daftar", ...rows.map((r) => `"${r.email.replace(/"/g, '""')}",${r.createdAt.toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pelanggan-infobanten-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
