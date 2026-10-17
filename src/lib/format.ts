const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const TZ = "Asia/Jakarta";

function parts(date: Date) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(f.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour") % 24, min: get("minute") };
}

/** Format tanggal seperti WordPress "F j, Y" dalam bahasa Indonesia: "Oktober 17, 2026" */
export function formatDate(date: Date) {
  const { y, m, d } = parts(date);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2026/10/17 pukul 11:56" — format tabel admin WordPress */
export function formatAdminDate(date: Date) {
  const { y, m, d, h, min } = parts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}/${pad(m)}/${pad(d)} pukul ${pad(h)}:${pad(min)}`;
}

/** Nilai untuk <input type="datetime-local"> dalam zona WIB */
export function toLocalInput(date: Date) {
  const { y, m, d, h, min } = parts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}

export function fromLocalInput(value: string) {
  return new Date(`${value}:00+07:00`);
}

export function stripTags(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&hellip;/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

/** Potong teks per kata dan tambahkan "…" seperti excerpt WordPress */
export function trimWords(text: string, words: number) {
  const list = text.split(/\s+/).filter(Boolean);
  if (list.length <= words) return text;
  return list.slice(0, words).join(" ") + "…";
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 200)
    .replace(/-+$/, "");
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
