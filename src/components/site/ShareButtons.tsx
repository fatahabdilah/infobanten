"use client";

import { useState } from "react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(`${title}\n${url}`);
  const enc = encodeURIComponent(url);
  const btn = "flex h-9 items-center gap-2 rounded-[25px] px-4 text-sm font-bold text-white transition-opacity hover:opacity-90";

  return (
    <div className="flex flex-wrap items-center gap-2 pt-8">
      <span className="mr-1 text-sm font-medium text-heading">Bagikan:</span>
      <a href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#25d366]`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm0-21.6A11.8 11.8 0 0 0 1.9 18L.2 24l6.2-1.6A11.8 11.8 0 1 0 12 .2Z" />
        </svg>
        WhatsApp
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#1877f2]`}>
        Facebook
      </a>
      <a href={`https://x.com/intent/post?url=${enc}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-black`}>
        X
      </a>
      <button
        type="button"
        className={`${btn} bg-heading`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
      >
        {copied ? "Tersalin!" : "Salin Link"}
      </button>
    </div>
  );
}
