"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { replyComment } from "@/app/actions/admin";

export default function ReplyBox({ postId, parentId, approveLabel }: { postId: number; parentId: number; approveLabel: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)}>
        {approveLabel ? "Setujui dan Balas" : "Balas"}
      </button>
    );
  return (
    <div className="mt-2 w-full max-w-[600px]">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full" autoFocus aria-label="Balasan" />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="button button-primary"
          disabled={pending || !text.trim()}
          onClick={() =>
            start(async () => {
              await replyComment(postId, parentId, text);
              setOpen(false);
              setText("");
              router.refresh();
            })
          }
        >
          {approveLabel ? "Setujui dan Balas" : "Balas"}
        </button>
        <button type="button" className="button" onClick={() => setOpen(false)}>
          Batal
        </button>
      </div>
    </div>
  );
}
