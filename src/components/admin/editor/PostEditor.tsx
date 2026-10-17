"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { quickAddCategory, savePost, trashPost, type MediaItem, type PostInput } from "@/app/actions/admin";
import { MediaModal } from "../MediaLibrary";
import { BlockToolbar, RichTextArea, useRichText } from "./RichText";

export type EditorCategory = { id: number; name: string; parentId: number | null };
export type EditorInitial = Omit<PostInput, "date" | "featuredId"> & {
  id?: number;
  date: string; // datetime-local WIB
  dateIsAuto: boolean;
  savedStatus: string; // status di database (untuk label tombol)
  featured: { id: number; url: string; alt: string } | null;
  modified?: string;
};

type Props = {
  initial: EditorInitial;
  categories: EditorCategory[];
  authors: { id: number; name: string }[];
  canPublish: boolean;
  siteUrl: string;
  siteName: string;
};

// Konten WordPress yang tidak bisa direpresentasikan editor visual → buka di Editor Kode agar tidak rusak
const COMPLEX = /<(table|script|style|form|video|audio|iframe(?![^>]*youtube))|wp-block-(columns|gallery|table|buttons|cover|group|media-text|file)|uagb-|wp-block-uagb|<figcaption/i;

const PANEL_KEY = "ib-editor-panels";

function Panel({ id, title, children, open, onToggle }: { id: string; title: string; children: React.ReactNode; open: boolean; onToggle: (id: string) => void }) {
  return (
    <div className="border-b border-[#e0e0e0]">
      <h2>
        <button
          type="button"
          onClick={() => onToggle(id)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-4 py-4 text-left text-[13px] font-medium text-[#1e1e1e] hover:bg-[#f0f0f0]"
        >
          {title}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={open ? "rotate-180" : ""}>
            <path d="M17.5 11.6 12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z" />
          </svg>
        </button>
      </h2>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { publish: "Terbit", future: "Terjadwal", draft: "Draf", pending: "Menunggu tinjauan", private: "Privat", trash: "Sampah" };

export default function PostEditor({ initial, categories: initialCats, authors, canPublish, siteUrl, siteName }: Props) {
  const router = useRouter();
  const label = "Pos";

  const [id, setId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [slug, setSlug] = useState(initial.slug);
  const [status, setStatus] = useState(initial.status);
  const [savedStatus, setSavedStatus] = useState(initial.savedStatus);
  const [date, setDate] = useState(initial.date);
  const [dateIsAuto, setDateIsAuto] = useState(initial.dateIsAuto);
  const [authorId, setAuthorId] = useState(initial.authorId);
  const [cats, setCats] = useState<number[]>(initial.categories);
  const [allCats, setAllCats] = useState(initialCats);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagInput, setTagInput] = useState("");
  const [featured, setFeatured] = useState(initial.featured);
  const [commentStatus, setCommentStatus] = useState(initial.commentStatus);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [sticky, setSticky] = useState(initial.sticky);

  const [mode, setMode] = useState<"visual" | "code">(COMPLEX.test(initial.content) ? "code" : "visual");
  const [sidebar, setSidebar] = useState(true);
  const [tab, setTab] = useState<"doc" | "block">("doc");
  const [panels, setPanels] = useState<Record<string, boolean>>({ summary: true, categories: true, tags: true, featured: true, excerpt: true, discussion: false, seo: true });
  const [modal, setModal] = useState<null | "featured" | "insert">(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [prePublish, setPrePublish] = useState(false);
  const [postPublish, setPostPublish] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [newCat, setNewCat] = useState<{ open: boolean; name: string; parent: string }>({ open: false, name: "", parent: "" });
  const [saving, startSaving] = useTransition();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(false);

  const editor = useRichText(initial.content, (html) => {
    setContent(html);
    setDirty(true);
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PANEL_KEY) || "null");
      if (saved) setPanels((p) => ({ ...p, ...saved }));
      if (window.innerWidth < 782) setSidebar(false);
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setDirty(true);
  }, [title, excerpt, slug, date, authorId, cats, tags, featured, commentStatus, seoTitle, seoDescription, sticky, status]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Tinggi textarea judul mengikuti isi
  useEffect(() => {
    const t = titleRef.current;
    if (t) {
      t.style.height = "auto";
      t.style.height = `${t.scrollHeight}px`;
    }
  }, [title]);

  const togglePanel = (key: string) =>
    setPanels((p) => {
      const next = { ...p, [key]: !p[key] };
      try {
        localStorage.setItem(PANEL_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const isPublished = savedStatus === "publish" || savedStatus === "future" || savedStatus === "private";
  const scheduledFuture = !dateIsAuto && new Date(`${date}:00+07:00`) > new Date();

  const save = useCallback(
    (nextStatus: PostInput["status"]) => {
      const html = mode === "visual" && editor ? editor.getHTML() : content;
      startSaving(async () => {
        const res = await savePost({
          id,
          type: initial.type,
          title,
          content: html === "<p></p>" ? "" : html,
          excerpt,
          slug,
          status: nextStatus,
          date: dateIsAuto ? null : date,
          authorId,
          categories: cats,
          tags,
          featuredId: featured?.id ?? null,
          commentStatus,
          seoTitle,
          seoDescription,
          sticky,
        });
        if (!res.ok) {
          setNotice({ type: "error", text: res.message });
          return;
        }
        setDirty(false);
        setSlug(res.slug);
        setSavedStatus(res.status);
        setStatus(res.status === "future" ? "publish" : (res.status as PostInput["status"]));
        setNotice({ type: "success", text: res.message });
        if (!id) {
          setId(res.id);
          window.history.replaceState(null, "", `/wp-admin/post.php?post=${res.id}&action=edit`);
        }
        if ((nextStatus === "publish" || nextStatus === "future") && !isPublished) setPostPublish(true);
        setPrePublish(false);
        router.refresh();
      });
    },
    [mode, editor, content, id, initial.type, title, excerpt, slug, dateIsAuto, date, authorId, cats, tags, featured, commentStatus, seoTitle, seoDescription, sticky, isPublished, router],
  );

  // Ctrl/Cmd + S = simpan
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(isPublished ? (status as PostInput["status"]) : "draft");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, isPublished, status]);

  function switchMode(next: "visual" | "code") {
    setMoreOpen(false);
    if (next === mode) return;
    if (next === "visual") {
      if (COMPLEX.test(content) && !confirm("Konten ini berisi blok WordPress yang kompleks (tabel, kolom, embed, dll). Editor visual dapat menghapus sebagian format. Lanjutkan?")) return;
      editor?.commands.setContent(content, false);
    } else if (editor) setContent(editor.getHTML());
    setMode(next);
  }

  const permalink = `${siteUrl}/${slug || "…"}/`;
  const publicUrl = `${siteUrl}/${slug}/`;
  const previewUrl = id ? (savedStatus === "publish" && !dirty ? `/${slug}/` : `/preview/${id}/`) : null;
  const words = useMemo(
    () =>
      content
        .replace(/<[^>]+>/g, " ")
        .split(/\s+/)
        .filter(Boolean).length,
    [content],
  );

  const primaryLabel = isPublished ? (savedStatus === "future" || scheduledFuture ? "Jadwalkan" : "Perbarui") : !canPublish ? "Kirim untuk Ditinjau" : scheduledFuture ? "Jadwalkan…" : "Terbitkan";

  function onPrimary() {
    if (isPublished) save(status === "private" ? "private" : scheduledFuture ? "future" : "publish");
    else if (!canPublish) save("pending");
    else setPrePublish(true);
  }

  async function addCategory() {
    const created = await quickAddCategory(newCat.name, Number(newCat.parent) || null);
    if (created) {
      setAllCats((c) => (c.some((x) => x.id === created.id) ? c : [...c, created].sort((a, b) => a.name.localeCompare(b.name))));
      setCats((c) => [...new Set([...c, created.id])]);
    }
    setNewCat({ open: false, name: "", parent: "" });
  }

  const catTree = useMemo(() => {
    const out: { cat: EditorCategory; depth: number }[] = [];
    const walk = (parent: number | null, depth: number) =>
      allCats
        .filter((c) => (c.parentId ?? null) === parent)
        .forEach((c) => {
          out.push({ cat: c, depth });
          walk(c.id, depth + 1);
        });
    walk(null, 0);
    allCats.filter((c) => !out.some((o) => o.cat.id === c.id)).forEach((c) => out.push({ cat: c, depth: 0 }));
    return out;
  }, [allCats]);

  function addTags(raw: string) {
    const parts = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length) setTags((t) => [...new Set([...t, ...parts])]);
    setTagInput("");
  }

  const iconBtn = "flex size-9 items-center justify-center rounded-sm text-[#1e1e1e] hover:text-[#2271b1]";
  const seoTitleShown = seoTitle || `${title || "(tanpa judul)"} - ${siteName}`;
  const seoDescShown =
    seoDescription ||
    excerpt ||
    content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155);

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* ── Bilah atas ── */}
      <header className="flex h-[60px] shrink-0 items-center border-b border-[#e0e0e0] bg-white pr-2">
        <Link
          href="/wp-admin/edit.php"
          className="flex size-[60px] shrink-0 items-center justify-center bg-[#1e1e1e] !text-white"
          title="Lihat Pos"
          onClick={(e) => dirty && !confirm("Perubahan yang belum disimpan akan hilang. Tinggalkan halaman?") && e.preventDefault()}
        >
          <img src="/images/logo.png" alt="Kembali" width={36} height={36} className="size-9 rounded-full bg-white" />
        </Link>
        <div className="flex items-center gap-1 pl-3">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-sm bg-[#2271b1] text-white hover:bg-[#135e96]"
            title="Sisipkan gambar"
            onClick={() => setModal("insert")}
            disabled={mode !== "visual"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" />
            </svg>
          </button>
          <button type="button" className={iconBtn} title="Urungkan" onClick={() => editor?.chain().focus().undo().run()} disabled={mode !== "visual" || !editor?.can().undo()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={editor?.can().undo() ? "" : "opacity-30"}>
              <path d="M18.3 11.7c-.6-.6-1.4-.9-2.3-.9H6.7l2.9-3.3-1.1-1-4.5 5L8.5 16l1-1-2.7-2.7H16c.5 0 .9.2 1.3.5 1 1 1 3.4 1 4.5v.3h1.5v-.2c0-1.5 0-4.3-1.5-5.7z" />
            </svg>
          </button>
          <button type="button" className={iconBtn} title="Ulangi" onClick={() => editor?.chain().focus().redo().run()} disabled={mode !== "visual" || !editor?.can().redo()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={editor?.can().redo() ? "" : "opacity-30"}>
              <path d="M15.6 6.5l-1.1 1 2.9 3.3H8c-.9 0-1.7.3-2.3.9-1.4 1.5-1.4 4.2-1.4 5.6v.2h1.5v-.3c0-1.1 0-3.5 1-4.5.3-.3.7-.5 1.3-.5h9.2L14.5 15l1.1 1.1 4.6-4.6-4.6-5z" />
            </svg>
          </button>
        </div>

        <div className="mx-auto hidden min-w-0 max-w-[460px] items-center gap-2 whitespace-nowrap rounded bg-[#f0f0f0] px-4 py-1.5 text-[13px] text-[#1e1e1e] md:flex">
          <span className="truncate font-medium">{title || "(tanpa judul)"}</span>
          <span className="shrink-0 text-[#757575]">· {label}</span>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {!isPublished && (
            <button
              type="button"
              className="hidden h-9 rounded-sm px-3 text-[13px] text-[#2271b1] hover:text-[#135e96] disabled:text-[#757575] sm:block"
              disabled={saving || (!dirty && !!id)}
              onClick={() => save(status === "pending" ? "pending" : "draft")}
            >
              {saving ? "Menyimpan…" : !dirty && id ? "Tersimpan" : status === "pending" ? "Simpan sebagai Tertunda" : "Simpan draf"}
            </button>
          )}
          {previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noopener" className={iconBtn} title="Pratinjau">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.5 4.5h-7V6h4.44l-5.97 5.97 1.06 1.06L18 7.06v4.44h1.5v-7Zm-13 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3H17v3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h3V5.5h-3Z" />
              </svg>
            </a>
          ) : (
            <span className={`${iconBtn} opacity-30`} title="Simpan dulu untuk pratinjau">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.5 4.5h-7V6h4.44l-5.97 5.97 1.06 1.06L18 7.06v4.44h1.5v-7Zm-13 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3H17v3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h3V5.5h-3Z" />
              </svg>
            </span>
          )}
          <button type="button" onClick={onPrimary} disabled={saving} className="h-9 rounded-sm bg-[#2271b1] px-3 text-[13px] font-medium text-white hover:bg-[#135e96] disabled:opacity-60">
            {saving && isPublished ? "Memperbarui…" : primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => setSidebar((s) => !s)}
            aria-pressed={sidebar}
            title="Pengaturan"
            className={`flex size-9 items-center justify-center rounded-sm ${sidebar ? "bg-[#1e1e1e] text-white" : "text-[#1e1e1e]"}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 14c0 .3-.2.5-.5.5h-4v-13h4c.3 0 .5.2.5.5v12zm-14 0V6c0-.3.2-.5.5-.5h7.5v13H5c-.3 0-.5-.2-.5-.5z" />
            </svg>
          </button>
          <div className="relative">
            <button type="button" className={iconBtn} title="Opsi" onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M13 19h-2v-2h2v2zm0-6h-2v-2h2v2zm0-6h-2V5h2v2z" />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-10 z-50 w-56 border border-[#1e1e1e] bg-white py-2 text-[13px] shadow-lg">
                <p className="px-4 pb-1 text-[11px] font-medium uppercase text-[#757575]">Editor</p>
                {(
                  [
                    ["visual", "Editor visual"],
                    ["code", "Editor kode"],
                  ] as const
                ).map(([m, l]) => (
                  <button key={m} type="button" onClick={() => switchMode(m)} className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-[#f0f0f0]">
                    {l} {mode === m && "✓"}
                  </button>
                ))}
                <div className="my-1 border-t border-[#e0e0e0]" />
                <p className="px-4 py-1 text-[#757575]">{words} kata</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {notice && (
        <div
          className={`flex shrink-0 items-center justify-between border-l-4 px-4 py-2.5 text-[13px] ${notice.type === "success" ? "border-[#00a32a] bg-[#eff9f1]" : "border-[#cc1818] bg-[#f4a2a2]/20"}`}
        >
          <span>
            {notice.text}{" "}
            {notice.type === "success" && savedStatus === "publish" && (
              <a href={publicUrl} target="_blank" rel="noopener">
                Lihat {label}
              </a>
            )}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Tutup pemberitahuan" className="text-lg leading-none">
            ×
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ── Kanvas ── */}
        <main className="flex min-w-0 flex-1 flex-col">
          {mode === "visual" && <BlockToolbar editor={editor} onInsertImage={() => setModal("insert")} />}
          <div className="min-h-0 flex-1 overflow-y-auto bg-white">
            <div className="mx-auto max-w-[840px] px-5 pb-40 pt-12 md:px-10">
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    editor?.commands.focus("start");
                  }
                }}
                placeholder="Tambahkan judul"
                aria-label="Tambahkan judul"
                rows={1}
                className="!m-0 block w-full resize-none overflow-hidden !border-0 !bg-transparent !p-0 font-heading !text-[40px] !font-normal !leading-[1.2] text-[#3a3a3a] !shadow-none placeholder:text-[#3a3a3a]/50 focus:!shadow-none"
              />
              <div className="mt-8">
                {mode === "visual" ? (
                  <RichTextArea editor={editor} />
                ) : (
                  <div>
                    <p className="mb-2 flex items-center justify-between text-[13px] text-[#757575]">
                      <span>Mengedit kode HTML</span>
                      <button type="button" className="button-link" onClick={() => switchMode("visual")}>
                        Keluar dari editor kode
                      </button>
                    </p>
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        setDirty(true);
                      }}
                      spellCheck={false}
                      aria-label="Tulis HTML"
                      className="min-h-[60vh] w-full !rounded-none !border-[#1e1e1e] !p-4 font-mono !text-[14px] !leading-[1.6]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ── Sidebar pengaturan ── */}
        {sidebar && (
          <aside className="fixed inset-x-0 bottom-0 top-[60px] z-40 w-full overflow-y-auto border-l border-[#e0e0e0] bg-white md:static md:w-[280px] md:shrink-0">
            <div className="sticky top-0 z-10 flex items-center border-b border-[#e0e0e0] bg-white">
              {(
                [
                  ["doc", label],
                  ["block", "Blok"],
                ] as const
              ).map(([key, l]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`h-12 px-4 text-[13px] font-medium ${tab === key ? "shadow-[inset_0_-3px_0_#2271b1] text-[#1e1e1e]" : "text-[#757575] hover:text-[#2271b1]"}`}
                >
                  {l}
                </button>
              ))}
              <button type="button" onClick={() => setSidebar(false)} className="ml-auto mr-2 flex size-8 items-center justify-center text-xl" aria-label="Tutup pengaturan">
                ×
              </button>
            </div>

            {tab === "block" ? (
              <div className="p-4 text-[13px] text-[#757575]">
                {mode === "visual" ? (
                  <>
                    <p className="mb-3 font-medium text-[#1e1e1e]">Paragraf</p>
                    <p>Gunakan bilah alat di atas kanvas untuk mengubah jenis blok, perataan teks, menambah tautan, gambar, atau embed video.</p>
                    <p className="mt-3">Pintasan: Ctrl+B tebal, Ctrl+I miring, Ctrl+K tautan, Ctrl+S simpan.</p>
                  </>
                ) : (
                  <p>Pengaturan blok tidak tersedia di editor kode.</p>
                )}
              </div>
            ) : (
              <>
                <Panel id="summary" title="Ringkasan" open={panels.summary} onToggle={togglePanel}>
                  <dl className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-x-2 gap-y-3 text-[13px]">
                    <dt className="text-[#1e1e1e]">Status</dt>
                    <dd>
                      <select value={status} onChange={(e) => setStatus(e.target.value as PostInput["status"])} className="w-full !text-[13px]">
                        {canPublish && <option value="publish">{scheduledFuture ? "Terjadwal" : "Terbit"}</option>}
                        <option value="draft">Draf</option>
                        <option value="pending">Menunggu tinjauan</option>
                        {canPublish && <option value="private">Privat</option>}
                      </select>
                    </dd>
                    <dt className="text-[#1e1e1e]">Terbitkan</dt>
                    <dd>
                      {dateIsAuto ? (
                        <button type="button" className="button-link text-left" onClick={() => setDateIsAuto(false)}>
                          Segera
                        </button>
                      ) : (
                        <div>
                          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full !text-[12px]" />
                          {!isPublished && (
                            <button type="button" className="button-link mt-1 !text-xs" onClick={() => setDateIsAuto(true)}>
                              Atur ke &quot;Segera&quot;
                            </button>
                          )}
                        </div>
                      )}
                    </dd>
                    <dt className="text-[#1e1e1e]">Tautan</dt>
                    <dd className="min-w-0">
                      <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="otomatis-dari-judul" className="w-full !text-[12px]" aria-label="Slug URL" />
                      <a href={savedStatus === "publish" ? publicUrl : undefined} target="_blank" rel="noopener" className="mt-1 block break-all text-[11px] leading-snug">
                        {permalink}
                      </a>
                    </dd>
                    {authors.length > 1 && (
                      <>
                        <dt className="text-[#1e1e1e]">Penulis</dt>
                        <dd>
                          <select value={authorId} onChange={(e) => setAuthorId(Number(e.target.value))} className="w-full !text-[13px]">
                            {authors.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </dd>
                      </>
                    )}
                  </dl>
                  <label className="mt-3 flex items-center gap-2 text-[13px]">
                    <input type="checkbox" checked={sticky} onChange={(e) => setSticky(e.target.checked)} /> Lekatkan di bagian atas blog
                  </label>
                  {savedStatus && (
                    <p className="mt-3 text-xs text-[#757575]">
                      Status tersimpan: {STATUS_LABEL[savedStatus] ?? savedStatus}
                      {initial.modified && ` · Terakhir diubah ${initial.modified}`}
                    </p>
                  )}
                  {id && (
                    <button
                      type="button"
                      className="mt-4 h-9 w-full rounded-sm border border-[#cc1818] text-[13px] text-[#cc1818] hover:bg-[#cc1818] hover:text-white"
                      onClick={async () => {
                        if (!confirm(`Pindahkan ${label.toLowerCase()} ini ke Tong Sampah?`)) return;
                        await trashPost(id);
                        setDirty(false);
                        router.push("/wp-admin/edit.php?trashed=1");
                      }}
                    >
                      Pindahkan ke Tong Sampah
                    </button>
                  )}
                </Panel>

                <Panel id="categories" title="Kategori" open={panels.categories} onToggle={togglePanel}>
                  <div className="max-h-[220px] overflow-y-auto border border-[#e0e0e0] p-2">
                    {catTree.map(({ cat, depth }) => (
                      <label key={cat.id} className="flex items-center gap-2 py-1 text-[13px]" style={{ paddingLeft: depth * 16 }}>
                        <input type="checkbox" checked={cats.includes(cat.id)} onChange={(e) => setCats((c) => (e.target.checked ? [...c, cat.id] : c.filter((x) => x !== cat.id)))} />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                  {newCat.open ? (
                    <div className="mt-3 space-y-2">
                      <label className="block text-[11px] font-medium uppercase">Nama kategori baru</label>
                      <input type="text" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="w-full" autoFocus />
                      <label className="block text-[11px] font-medium uppercase">Induk Kategori</label>
                      <select value={newCat.parent} onChange={(e) => setNewCat({ ...newCat, parent: e.target.value })} className="w-full">
                        <option value="">— Induk Kategori —</option>
                        {allCats.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="button" onClick={addCategory} disabled={!newCat.name.trim()}>
                        Tambah Kategori Baru
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="button-link mt-3" onClick={() => setNewCat({ ...newCat, open: true })}>
                      Tambah Kategori Baru
                    </button>
                  )}
                </Panel>

                <Panel id="tags" title="Tag" open={panels.tags} onToggle={togglePanel}>
                  <label className="mb-1 block text-[11px] font-medium uppercase">Tambah tag baru</label>
                  <div className="flex flex-wrap items-center gap-1 rounded-sm border border-[#949494] p-1">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center rounded-sm bg-[#ddd] pl-2 text-[13px] text-[#1e1e1e]">
                        {t}
                        <button type="button" className="px-1.5" aria-label={`Hapus ${t}`} onClick={() => setTags((x) => x.filter((y) => y !== t))}>
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => (e.target.value.endsWith(",") ? addTags(e.target.value) : setTagInput(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTags(tagInput);
                        } else if (e.key === "Backspace" && !tagInput && tags.length) setTags((x) => x.slice(0, -1));
                      }}
                      onBlur={() => tagInput && addTags(tagInput)}
                      className="min-w-[80px] flex-1 !border-0 !shadow-none"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[#757575]">Pisahkan dengan koma atau tombol Enter.</p>
                </Panel>

                <Panel id="featured" title="Gambar Unggulan" open={panels.featured} onToggle={togglePanel}>
                  {featured ? (
                    <div>
                      <button type="button" onClick={() => setModal("featured")} className="block w-full" title="Ganti gambar">
                        <img src={featured.url} alt={featured.alt} className="w-full" />
                      </button>
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="button flex-1" onClick={() => setModal("featured")}>
                          Ganti
                        </button>
                        <button type="button" className="button flex-1 !border-[#cc1818] !text-[#cc1818]" onClick={() => setFeatured(null)}>
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModal("featured")}
                      className="flex h-[90px] w-full items-center justify-center rounded-sm bg-[#f0f0f0] text-[13px] text-[#1e1e1e] hover:bg-[#e0e0e0]"
                    >
                      Atur gambar unggulan
                    </button>
                  )}
                  <p className="mt-2 text-xs text-[#757575]">Gambar ini juga dipakai sebagai pratinjau saat link dibagikan ke WhatsApp/Facebook.</p>
                </Panel>

                <Panel id="excerpt" title="Kutipan" open={panels.excerpt} onToggle={togglePanel}>
                  <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={4} className="w-full !text-[13px]" aria-label="Tulis kutipan (opsional)" />
                  <p className="mt-1 text-xs text-[#757575]">Tulis kutipan (opsional). Jika kosong, diambil otomatis dari awal konten.</p>
                </Panel>

                <Panel id="discussion" title="Diskusi" open={panels.discussion} onToggle={togglePanel}>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" checked={commentStatus === "open"} onChange={(e) => setCommentStatus(e.target.checked ? "open" : "closed")} /> Izinkan komentar
                  </label>
                </Panel>

                <Panel id="seo" title="SEO & Pratinjau Link" open={panels.seo} onToggle={togglePanel}>
                  <label className="mb-1 block text-[11px] font-medium uppercase">Judul SEO</label>
                  <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={`${title || "Judul"} - ${siteName}`} className="w-full !text-[13px]" />
                  <p className={`mt-0.5 text-right text-[11px] ${seoTitleShown.length > 60 ? "text-[#cc1818]" : "text-[#757575]"}`}>{seoTitleShown.length}/60</p>
                  <label className="mb-1 mt-2 block text-[11px] font-medium uppercase">Deskripsi meta</label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    placeholder="Ringkasan yang muncul di Google & WhatsApp"
                    className="w-full !text-[13px]"
                  />
                  <p className={`mt-0.5 text-right text-[11px] ${seoDescShown.length > 160 ? "text-[#cc1818]" : "text-[#757575]"}`}>{seoDescShown.length}/160</p>

                  <p className="mb-1 mt-3 text-[11px] font-medium uppercase">Pratinjau WhatsApp</p>
                  <div className="rounded-lg bg-[#d9fdd3] p-1.5">
                    <div className="overflow-hidden rounded-md bg-[#f0f2f5]">
                      {featured ? (
                        <img src={featured.url} alt="" className="aspect-[1200/630] w-full object-cover" />
                      ) : (
                        <img src="/images/og-default.jpg" alt="" className="aspect-[1200/630] w-full object-cover" />
                      )}
                      <div className="px-2 py-1.5">
                        <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#111b21]">{seoTitleShown}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-[#667781]">{seoDescShown}</p>
                        <p className="mt-0.5 text-[10px] text-[#667781]">{siteUrl.replace(/^https?:\/\//, "")}</p>
                      </div>
                    </div>
                  </div>
                  <p className="mb-1 mt-3 text-[11px] font-medium uppercase">Pratinjau Google</p>
                  <div className="rounded border border-[#e0e0e0] p-2">
                    <p className="truncate text-[11px] text-[#202124]">{permalink}</p>
                    <p className="line-clamp-1 text-[15px] leading-snug text-[#1a0dab]">{seoTitleShown}</p>
                    <p className="line-clamp-2 text-[12px] text-[#4d5156]">{seoDescShown}</p>
                  </div>
                </Panel>
              </>
            )}
          </aside>
        )}

        {/* ── Panel pra-terbit / pasca-terbit ── */}
        {(prePublish || postPublish) && (
          <aside className="fixed bottom-0 right-0 top-[60px] z-50 w-full overflow-y-auto border-l border-[#e0e0e0] bg-white shadow-[-2px_0_8px_rgba(0,0,0,.08)] md:w-[280px]">
            {prePublish ? (
              <div>
                <div className="flex items-center gap-2 border-b border-[#e0e0e0] p-4">
                  <button
                    type="button"
                    onClick={() => save(scheduledFuture ? "future" : "publish")}
                    disabled={saving}
                    className="h-9 rounded-sm bg-[#2271b1] px-3 text-[13px] font-medium text-white hover:bg-[#135e96] disabled:opacity-60"
                  >
                    {saving ? "Menerbitkan…" : scheduledFuture ? "Jadwalkan" : "Terbitkan"}
                  </button>
                  <button type="button" onClick={() => setPrePublish(false)} className="h-9 px-3 text-[13px] text-[#2271b1]">
                    Batal
                  </button>
                </div>
                <div className="p-4 text-[13px]">
                  <p className="text-base font-medium text-[#1e1e1e]">{scheduledFuture ? "Siap untuk dijadwalkan?" : "Siap untuk menerbitkan?"}</p>
                  <p className="mt-2 text-[#757575]">Periksa kembali pengaturan Anda sebelum menerbitkan.</p>
                  <dl className="mt-4 space-y-2">
                    <div className="flex justify-between gap-2">
                      <dt>Visibilitas:</dt>
                      <dd className="font-medium">{status === "private" ? "Privat" : "Publik"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Terbitkan:</dt>
                      <dd className="font-medium">{dateIsAuto ? "Segera" : date.replace("T", " ")}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Kategori:</dt>
                      <dd className="text-right font-medium">
                        {cats.length
                          ? allCats
                              .filter((c) => cats.includes(c.id))
                              .map((c) => c.name)
                              .join(", ")
                          : "Uncategorized"}
                      </dd>
                    </div>
                  </dl>
                  {!featured && <p className="mt-4 rounded bg-[#fcf9e8] p-2 text-xs">Belum ada gambar unggulan — pratinjau link WhatsApp akan memakai gambar default situs.</p>}
                </div>
              </div>
            ) : (
              <div className="p-4 text-[13px]">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setPostPublish(false)} className="text-xl" aria-label="Tutup panel">
                    ×
                  </button>
                </div>
                <p className="text-base font-medium text-[#1e1e1e]">
                  <a href={publicUrl} target="_blank" rel="noopener">
                    {title || "(tanpa judul)"}
                  </a>{" "}
                  sudah {savedStatus === "future" ? "dijadwalkan" : "tayang"}.
                </p>
                <p className="mt-4 text-[11px] font-medium uppercase">Alamat {label.toLowerCase()}</p>
                <input type="text" readOnly value={publicUrl} onFocus={(e) => e.target.select()} className="mt-1 w-full !text-xs" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={publicUrl} target="_blank" rel="noopener" className="button">
                    Lihat {label}
                  </a>
                  <button type="button" className="button" onClick={() => navigator.clipboard?.writeText(publicUrl)}>
                    Salin
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${publicUrl}`)}`} target="_blank" rel="noopener" className="button !border-[#25d366] !text-[#128c4b]">
                    Bagikan ke WhatsApp
                  </a>
                </div>
                <p className="mt-6 text-[11px] font-medium uppercase">Apa selanjutnya?</p>
                <Link href="/wp-admin/post-new.php" className="mt-1 block">
                  Tambah {label} baru
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>

      {modal && (
        <MediaModal
          title={modal === "featured" ? "Gambar Unggulan" : "Sisipkan Media"}
          buttonLabel={modal === "featured" ? "Atur gambar unggulan" : `Sisipkan ke ${label.toLowerCase()}`}
          initialId={modal === "featured" ? featured?.id : undefined}
          onClose={() => setModal(null)}
          onChoose={(m: MediaItem) => {
            if (modal === "featured") setFeatured({ id: m.id, url: m.medium, alt: m.alt });
            else if (editor) {
              editor
                .chain()
                .focus()
                .setImage({ src: m.large, alt: m.alt || m.title })
                .updateAttributes("image", { class: `wp-image-${m.id}` })
                .run();
            }
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
