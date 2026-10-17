"use client";

import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

/** Blok embed (YouTube, Maps, dsb.) */
const Iframe = Node.create({
  name: "iframe",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      width: { default: "560" },
      height: { default: "315" },
      title: { default: "" },
      allowfullscreen: { default: "true" },
    };
  },
  parseHTML: () => [{ tag: "iframe[src]" }],
  renderHTML({ HTMLAttributes }) {
    return ["figure", { class: "wp-block-embed" }, ["iframe", mergeAttributes(HTMLAttributes, { frameborder: "0", loading: "lazy" })]];
  },
});

/** Gambar dengan atribut WordPress (class wp-image-ID, ukuran) */
const WpImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },
}).configure({ inline: false, allowBase64: false });

/** Paragraf/judul juga membaca class "has-text-align-*" dari Gutenberg */
const Align = TextAlign.extend({
  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (el) => el.style.textAlign || el.className.match(/has-text-align-(left|center|right|justify)/)?.[1] || null,
            renderHTML: (attrs) => (attrs.textAlign ? { style: `text-align: ${attrs.textAlign}` } : {}),
          },
        },
      },
    ];
  },
});

export type RichTextApi = Editor;

export function useRichText(initial: string, onChange: (html: string) => void) {
  return useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener", target: null } }),
      WpImage,
      Iframe,
      Align.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Mulai menulis, atau gunakan bilah alat di atas untuk menambahkan blok…" }),
    ],
    content: initial,
    editorProps: { attributes: { class: "entry-content ib-editor min-h-[50vh] outline-none" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
}

const Btn = ({
  on,
  label,
  onClick,
  children,
  disabled,
}: {
  on?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={on}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`flex h-9 min-w-9 items-center justify-center rounded-sm px-1.5 text-[13px] text-[#1e1e1e] disabled:opacity-30 ${
      on ? "bg-[#1e1e1e] text-white" : "hover:text-[#2271b1]"
    }`}
  >
    {children}
  </button>
);

const Sep = () => <span className="mx-1 h-6 w-px bg-[#e0e0e0]" />;

/** Toolbar blok (mode "Bilah Alat Atas" Gutenberg) */
export function BlockToolbar({ editor, onInsertImage }: { editor: Editor | null; onInsertImage: () => void }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const rerender = () => force((n) => n + 1);
    editor.on("transaction", rerender);
    return () => {
      editor.off("transaction", rerender);
    };
  }, [editor]);
  if (!editor) return null;

  const c = () => editor.chain().focus();
  const blockType = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("heading", { level: 4 })
          ? "h4"
          : editor.isActive("codeBlock")
            ? "code"
            : "p";

  function setLink() {
    const prev = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Tempel URL atau ketik untuk mencari", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") c().extendMarkRange("link").unsetLink().run();
    else c().extendMarkRange("link").setLink({ href: url }).run();
  }

  function embed() {
    const url = window.prompt("Masukkan URL YouTube atau URL embed (iframe src)");
    if (!url) return;
    const yt = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
    const src = yt ? `https://www.youtube.com/embed/${yt[1]}` : url;
    c().insertContent({ type: "iframe", attrs: { src } }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e0e0e0] bg-white px-2 py-1">
      <select
        aria-label="Ubah jenis blok"
        value={blockType}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") c().setParagraph().run();
          else if (v === "code") c().toggleCodeBlock().run();
          else c().setHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 | 4 }).run();
        }}
        className="!min-h-8 !border-[#e0e0e0] !text-[13px]"
      >
        <option value="p">Paragraf</option>
        <option value="h2">Judul 2</option>
        <option value="h3">Judul 3</option>
        <option value="h4">Judul 4</option>
        <option value="h1">Judul 1</option>
        <option value="code">Kode</option>
      </select>
      <Sep />
      <Btn label="Tebal (Ctrl+B)" on={editor.isActive("bold")} onClick={() => c().toggleBold().run()}>
        <b>B</b>
      </Btn>
      <Btn label="Miring (Ctrl+I)" on={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}>
        <i className="font-serif">I</i>
      </Btn>
      <Btn label="Garis bawah (Ctrl+U)" on={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()}>
        <u>U</u>
      </Btn>
      <Btn label="Coret" on={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}>
        <s>S</s>
      </Btn>
      <Btn label="Tautan (Ctrl+K)" on={editor.isActive("link")} onClick={setLink}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M10 17.4H7.4a5.4 5.4 0 0 1 0-10.8H10V8H7.4a3.9 3.9 0 0 0 0 7.9H10v1.5Zm4-10.8h2.6a5.4 5.4 0 0 1 0 10.8H14V16h2.6a3.9 3.9 0 0 0 0-7.9H14V6.6Zm-5 4.6h6v1.5H9v-1.5Z" />
        </svg>
      </Btn>
      <Sep />
      {(["left", "center", "right", "justify"] as const).map((a) => (
        <Btn key={a} label={{ left: "Rata kiri", center: "Rata tengah", right: "Rata kanan", justify: "Rata kiri-kanan" }[a]} on={editor.isActive({ textAlign: a })} onClick={() => c().setTextAlign(a).run()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            {a === "left" && <path d="M4 19.8h8.9v-1.5H4v1.5Zm8.9-15.6H4v1.5h8.9V4.2Zm-8.9 7v1.5h16v-1.5H4Z" />}
            {a === "center" && <path d="M7.5 5.5h9V4h-9v1.5Zm-3.5 7h16V11H4v1.5Zm3.5 7h9V18h-9v1.5Z" />}
            {a === "right" && <path d="M11.1 19.8H20v-1.5h-8.9v1.5Zm0-15.6v1.5H20V4.2h-8.9ZM4 12.8h16v-1.5H4v1.5Z" />}
            {a === "justify" && <path d="M4 12.8h16v-1.5H4v1.5zm0 7h16v-1.5H4v1.5zm0-15.6v1.5h16V4.2H4z" />}
          </svg>
        </Btn>
      ))}
      <Sep />
      <Btn label="Daftar" on={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.1 15.8H20v-1.5h-8.9v1.5zm0-8.6v1.5H20V7.2h-8.9zM6 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </Btn>
      <Btn label="Daftar bernomor" on={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.1 15.8H20v-1.5h-8.9v1.5zm0-8.6v1.5H20V7.2h-8.9zM5 6.7V10h1V5.3L3.8 6l.4 1 .8-.3zm-.4 5.7c-.3.1-.5.2-.7.3l.1 1.1c.2-.2.5-.4.8-.5.3-.1.6 0 .7.1.2.3 0 .8-.2 1.1-.5.8-.9 1.6-1.4 2.5h2.7v-1h-1c.3-.6.8-1.4.9-2.1.1-.3 0-.8-.2-1.1-.5-.6-1.3-.5-1.7-.4z" />
        </svg>
      </Btn>
      <Btn label="Kutipan" on={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13 6v6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H13zm-9 6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H4v6z" />
        </svg>
      </Btn>
      <Sep />
      <Btn label="Sisipkan gambar" onClick={onInsertImage}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v8.4l-3-2.9c-.3-.3-.8-.3-1 0L11.9 14 9 12c-.3-.2-.6-.2-.8 0l-3.6 2.6V5c-.1-.3.1-.5.4-.5zm14 15H5c-.3 0-.5-.2-.5-.5v-2.4l4.1-3 3 1.9c.3.2.7.2.9-.1L16 12l3.5 3.4V19c0 .3-.2.5-.5.5z" />
        </svg>
      </Btn>
      <Btn label="Sematkan video / iframe" onClick={embed}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19 6H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm.5 11c0 .3-.2.5-.5.5H6c-.3 0-.5-.2-.5-.5V8c0-.3.2-.5.5-.5h13c.3 0 .5.2.5.5v9zM10 10v5l4.5-2.5L10 10z" />
        </svg>
      </Btn>
      <Btn label="Pemisah" onClick={() => c().setHorizontalRule().run()}>
        —
      </Btn>
      <Sep />
      <Btn label="Hapus format" onClick={() => c().unsetAllMarks().clearNodes().run()}>
        <span className="text-xs">Tx</span>
      </Btn>
    </div>
  );
}

export function RichTextArea({ editor }: { editor: Editor | null }) {
  return <EditorContent editor={editor} />;
}
