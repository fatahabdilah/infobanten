"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { deleteMedia, finalizeDirectUpload, listMedia, requestDirectUpload, updateMedia, uploadMedia, uploadMode, type MediaItem } from "@/app/actions/admin";

const MAX_BYTES = 20 * 1024 * 1024;

/** Unggah satu file langsung ke Supabase Storage via signed URL, lalu server memproses ukurannya */
async function directUpload(file: File) {
  const { signedUrl, path, anonKey } = await requestDirectUpload(file.name, file.type, file.size);
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);
  const res = await fetch(signedUrl, {
    method: "PUT",
    body,
    headers: { "x-upsert": "false", ...(anonKey ? { apikey: anonKey, authorization: `Bearer ${anonKey}` } : {}) },
  });
  if (!res.ok) return { ok: false as const, name: file.name, message: `Unggah ke penyimpanan gagal (${res.status}).` };
  return finalizeDirectUpload(path, file.name, file.type);
}

const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

export function UploadDropzone({ onUploaded, accept }: { onUploaded: (ids: number[]) => void; accept?: string }) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function send(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    setErrors([]);
    const errs: string[] = [];
    const ids: number[] = [];
    try {
      const mode = await uploadMode();
      const ok = list.filter((f) => {
        if (f.size > MAX_BYTES) errs.push(`“${f.name}” melebihi ukuran maksimum 20 MB.`);
        return f.size <= MAX_BYTES;
      });
      if (mode === "direct") {
        for (const f of ok) {
          try {
            const r = await directUpload(f);
            if (r.ok) ids.push(r.id);
            else errs.push(`“${r.name}” gagal diunggah. ${r.message}`);
          } catch (e) {
            errs.push(`“${f.name}” gagal diunggah. ${(e as Error).message}`);
          }
        }
      } else if (ok.length) {
        const fd = new FormData();
        ok.forEach((f) => fd.append("async-upload", f));
        const res = await uploadMedia(fd);
        res.forEach((r) => (r.ok && r.id ? ids.push(r.id) : errs.push(`“${r.name}” gagal diunggah. ${r.message}`)));
      }
    } catch (e) {
      errs.push((e as Error).message || "Unggahan gagal.");
    }
    setErrors(errs);
    if (ids.length) onUploaded(ids);
    setBusy(false);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          send(e.dataTransfer.files);
        }}
        className={`flex min-h-[280px] flex-col items-center justify-center border-4 border-dashed p-8 text-center ${
          drag ? "border-[#2271b1] bg-[#f0f6fc]" : "border-[#c3c4c7]"
        }`}
      >
        {busy ? (
          <>
            <p className="text-xl text-[#1d2327]">Mengunggah…</p>
            <div className="mt-4 h-2 w-64 overflow-hidden rounded bg-[#dcdcde]">
              <div className="h-full w-1/2 animate-pulse bg-[#2271b1]" />
            </div>
          </>
        ) : (
          <>
            <p className="text-xl text-[#1d2327]">Letakkan file untuk diunggah</p>
            <p className="my-2 text-[#50575e]">atau</p>
            <button type="button" className="button button-large" onClick={() => input.current?.click()}>
              Pilih File
            </button>
            <p className="mt-4 text-[#646970]">Ukuran file maksimum: 20 MB.</p>
          </>
        )}
        <input
          ref={input}
          type="file"
          multiple
          accept={accept ?? "image/*,application/pdf,video/mp4,video/webm,audio/mpeg"}
          className="hidden"
          onChange={(e) => e.target.files && send(e.target.files)}
        />
      </div>
      {errors.map((e) => (
        <div key={e} className="notice notice-error mt-3">
          <p>{e}</p>
        </div>
      ))}
    </div>
  );
}

function AttachmentDetails({ item, onChange, onDeleted }: { item: MediaItem; onChange: (m: MediaItem) => void; onDeleted: (id: number) => void }) {
  const [form, setForm] = useState({ title: item.title, alt: item.alt, caption: item.caption });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setForm({ title: item.title, alt: item.alt, caption: item.caption }), [item]);

  async function save(next: typeof form) {
    await updateMedia(item.id, next);
    onChange({ ...item, ...next });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  const field = (key: keyof typeof form, label: string, multiline = false) => (
    <label className="mb-2.5 grid grid-cols-[90px_1fr] items-start gap-2 text-xs text-[#646970]">
      <span className="pt-1.5 text-right">{label}</span>
      {multiline ? (
        <textarea rows={2} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} onBlur={() => save(form)} className="!text-xs" />
      ) : (
        <input type="text" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} onBlur={() => save(form)} className="!text-xs" />
      )}
    </label>
  );

  const absolute = typeof window !== "undefined" ? window.location.origin + item.url : item.url;

  return (
    <div className="text-xs">
      <h2 className="mb-3 text-xs font-semibold uppercase text-[#646970]">Detail Lampiran {saved && <span className="font-normal normal-case text-[#00a32a]">Tersimpan.</span>}</h2>
      <div className="mb-3 flex gap-3 border-b border-[#dcdcde] pb-3">
        {item.mime.startsWith("image/") ? (
          <img src={item.thumb} alt="" className="size-[120px] shrink-0 object-cover" />
        ) : (
          <div className="flex size-[120px] shrink-0 items-center justify-center bg-[#f0f0f1] text-[#646970]">{item.mime.split("/")[1]}</div>
        )}
        <div className="min-w-0 leading-5 text-[#3c434a]">
          <p className="break-all font-semibold">{item.filename}</p>
          <p>{fmtDate(item.date)}</p>
          <p>{fmtSize(item.fileSize)}</p>
          {item.width && <p>{item.width} × {item.height} piksel</p>}
          <a href={item.url} target="_blank" rel="noopener" className="block">Lihat file</a>
          <button
            type="button"
            className="button-link button-link-delete !text-xs"
            onClick={async () => {
              if (!confirm("Anda akan menghapus item ini secara permanen dari situs.\nTindakan ini tidak bisa dibatalkan.\n'Batal' untuk berhenti, 'OK' untuk menghapus.")) return;
              await deleteMedia(item.id);
              onDeleted(item.id);
            }}
          >
            Hapus permanen
          </button>
        </div>
      </div>
      {item.mime.startsWith("image/") && field("alt", "Teks alternatif", true)}
      {field("title", "Judul")}
      {field("caption", "Keterangan", true)}
      <label className="mb-2.5 grid grid-cols-[90px_1fr] items-start gap-2 text-[#646970]">
        <span className="pt-1.5 text-right">URL File</span>
        <div>
          <input type="text" readOnly value={absolute} className="w-full !text-xs" onFocus={(e) => e.target.select()} />
          <button
            type="button"
            className="button mt-1 !min-h-6 !text-xs !leading-6"
            onClick={() => {
              navigator.clipboard?.writeText(absolute);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Tersalin!" : "Salin URL ke papan klip"}
          </button>
        </div>
      </label>
    </div>
  );
}

/** Grid pustaka media + panel detail (dipakai di upload.php dan modal pemilih media) */
export function MediaLibrary({
  type = "all",
  selected,
  onSelect,
  refreshKey = 0,
  preselect,
}: {
  type?: "image" | "all";
  selected: MediaItem | null;
  onSelect: (m: MediaItem | null) => void;
  refreshKey?: number;
  preselect?: number[];
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(type);
  const [loading, startLoading] = useTransition();

  const load = useCallback(
    (p: number, q: string, f: "image" | "all", append: boolean) =>
      startLoading(async () => {
        const res = await listMedia({ page: p, search: q || undefined, type: f });
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setHasMore(res.hasMore);
        setTotal(res.total);
        setPage(p);
        if (!append && preselect?.length) {
          const found = res.items.find((i) => i.id === preselect[0]);
          if (found) onSelect(found);
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preselect],
  );

  useEffect(() => {
    const t = setTimeout(() => load(1, search, filter, false), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, filter, refreshKey, load]);

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#dcdcde] bg-white px-4 py-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value as "image" | "all")} aria-label="Saring media">
            <option value="all">Semua item media</option>
            <option value="image">Gambar</option>
          </select>
          <span className="text-[#646970]">{loading ? "Memuat…" : `${total} item`}</span>
          <input type="search" placeholder="Cari media…" value={search} onChange={(e) => setSearch(e.target.value)} className="ml-auto w-full sm:w-56" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
            {items.map((m) => {
              const on = selected?.id === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(on ? null : m)}
                    className={`relative block aspect-square w-full overflow-hidden bg-[#f0f0f1] shadow-[inset_0_0_15px_rgba(0,0,0,.1)] ${
                      on ? "outline outline-[3px] outline-offset-[-1px] outline-[#2271b1]" : "hover:outline hover:outline-1 hover:outline-[#8c8f94]"
                    }`}
                    title={m.filename}
                  >
                    {m.mime.startsWith("image/") ? (
                      <img src={m.thumb} alt={m.alt} loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full flex-col items-center justify-center p-2 text-[11px] text-[#50575e]">
                        <span className="mb-1 rounded bg-white px-2 py-1 uppercase">{m.mime.split("/")[1]}</span>
                        <span className="line-clamp-2 break-all">{m.filename}</span>
                      </span>
                    )}
                    {on && (
                      <span className="absolute right-0 top-0 flex size-6 items-center justify-center bg-[#2271b1] text-white shadow-[0_0_0_1px_#fff,0_0_0_2px_#2271b1]">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {!loading && items.length === 0 && <p className="py-10 text-center text-[#646970]">Tidak ada item media yang ditemukan.</p>}
          {hasMore && (
            <p className="py-4 text-center">
              <button type="button" className="button" disabled={loading} onClick={() => load(page + 1, search, filter, true)}>
                Muat lebih banyak
              </button>
            </p>
          )}
        </div>
      </div>
      {selected && (
        <aside className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-[#dcdcde] bg-[#f6f7f7] p-4 md:max-h-none md:w-[267px] md:border-l md:border-t-0">
          <AttachmentDetails
            item={selected}
            onChange={(m) => {
              setItems((prev) => prev.map((i) => (i.id === m.id ? m : i)));
              onSelect(m);
            }}
            onDeleted={(id) => {
              setItems((prev) => prev.filter((i) => i.id !== id));
              setTotal((t) => t - 1);
              onSelect(null);
            }}
          />
        </aside>
      )}
    </div>
  );
}

/** Modal pemilih media seperti wp.media() */
export function MediaModal({
  title,
  buttonLabel,
  type = "image",
  onClose,
  onChoose,
  initialId,
}: {
  title: string;
  buttonLabel: string;
  type?: "image" | "all";
  onClose: () => void;
  onChoose: (m: MediaItem) => void;
  initialId?: number | null;
}) {
  const [tab, setTab] = useState<"upload" | "library">("library");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [preselect, setPreselect] = useState<number[] | undefined>(initialId ? [initialId] : undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[160000]" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex flex-col bg-white shadow-[0_5px_15px_rgba(0,0,0,.7)] md:inset-[30px]">
        <div className="flex h-[50px] shrink-0 items-center justify-between px-4">
          <h1 className="text-[22px] font-semibold text-[#1d2327]">{title}</h1>
          <button type="button" onClick={onClose} className="flex size-[50px] items-center justify-center text-2xl text-[#646970] hover:text-[#2271b1]" aria-label="Tutup dialog">
            ×
          </button>
        </div>
        <div className="flex shrink-0 gap-1 border-b border-[#dcdcde] px-4">
          {(
            [
              ["upload", "Unggah file"],
              ["library", "Pustaka Media"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px border-b-4 px-2.5 py-2 text-sm ${tab === key ? "border-[#2271b1] text-[#1d2327]" : "border-transparent text-[#2271b1] hover:text-[#135e96]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 bg-white">
          {tab === "upload" ? (
            <div className="p-6">
              <UploadDropzone
                accept={type === "image" ? "image/*" : undefined}
                onUploaded={(ids) => {
                  setPreselect(ids.slice(-1));
                  setRefreshKey((k) => k + 1);
                  setTab("library");
                }}
              />
            </div>
          ) : (
            <MediaLibrary type={type} selected={selected} onSelect={setSelected} refreshKey={refreshKey} preselect={preselect} />
          )}
        </div>
        <div className="flex h-[61px] shrink-0 items-center justify-end border-t border-[#dcdcde] px-4">
          <button type="button" className="button button-primary button-large" disabled={!selected} onClick={() => selected && onChoose(selected)}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
