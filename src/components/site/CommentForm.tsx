"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitComment, type FormState } from "@/app/actions/public";

const STORAGE_KEY = "ib-comment-author";
const field =
  "h-[51.6px] w-full border border-line-strong bg-[#fafafa] p-3 text-base text-heading outline-none placeholder:text-[#757575] focus:border-primary";

export default function CommentForm({ postId }: { postId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitComment, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const form = formRef.current;
      if (saved && form) {
        (form.elements.namedItem("author") as HTMLInputElement).value = saved.author || "";
        (form.elements.namedItem("email") as HTMLInputElement).value = saved.email || "";
        (form.elements.namedItem("url") as HTMLInputElement).value = saved.url || "";
        (form.elements.namedItem("remember") as HTMLInputElement).checked = true;
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (state?.ok) (formRef.current?.elements.namedItem("comment") as HTMLTextAreaElement | null)?.form?.reset();
  }, [state]);

  function remember(e: React.FormEvent<HTMLFormElement>) {
    const f = new FormData(e.currentTarget);
    try {
      if (f.get("remember")) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ author: f.get("author"), email: f.get("email"), url: f.get("url") }));
      } else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return (
    <form ref={formRef} action={action} onSubmit={remember}>
      <input type="hidden" name="postId" value={postId} />
      <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <p className="text-base leading-[25.6px] text-body">
        Alamat email Anda tidak akan dipublikasikan. Ruas yang wajib ditandai <span className="text-red-600">*</span>
      </p>
      <textarea
        name="comment"
        required
        rows={8}
        placeholder="Ketik di sini.."
        aria-label="Komentar"
        className="mt-6 h-[230px] w-full border border-line-strong bg-[#fafafa] p-3 text-base leading-[25.6px] text-heading outline-none placeholder:text-[#757575] focus:border-primary"
      />
      <div className="mt-2.5 grid gap-5 sm:grid-cols-3 sm:gap-10">
        <input name="author" required placeholder="Name*" aria-label="Nama" className={field} />
        <input name="email" type="email" required placeholder="Email*" aria-label="Email" className={field} />
        <input name="url" type="url" placeholder="Situs Web" aria-label="Situs Web" className={field} />
      </div>
      <label className="mt-6 flex items-start gap-2.5 text-base leading-[25.6px] text-body">
        <input type="checkbox" name="remember" className="mt-1.5 size-[13px]" />
        Simpan nama, email, dan situs web saya pada peramban ini untuk komentar saya berikutnya.
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 h-[49.7px] min-w-[166px] rounded-[2px] bg-primary px-6 text-base font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim Komentar"}
      </button>
      {state && (
        <p role="status" className={`mt-3 text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
