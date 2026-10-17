"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  const [show, setShow] = useState(false);
  return (
    <>
      {state?.error && (
        <div className="mb-5 border-l-4 border-[#d63638] bg-white px-3 py-3 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,.04)]">
          <strong>Galat:</strong> {state.error}
        </div>
      )}
      <form action={action} className="border border-[#c3c4c7] bg-white px-6 pb-[34px] pt-[26px] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <label htmlFor="user_login" className="text-sm leading-[1.5]">Nama Pengguna atau Alamat Email</label>
        <input
          id="user_login"
          name="log"
          key={state?.log ?? ""}
          defaultValue={state?.log ?? ""}
          autoComplete="username"
          autoFocus={!state?.log}
          className="mb-4 mt-0.5 w-full rounded border border-[#8c8f94] px-2 py-[3px] text-2xl leading-[1.33] outline-none focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1]"
        />
        <label htmlFor="user_pass" className="text-sm leading-[1.5]">Kata Sandi</label>
        <div className="relative mb-4 mt-0.5">
          <input
            id="user_pass"
            name="pwd"
            autoFocus={!!state?.log}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            className="w-full rounded border border-[#8c8f94] py-[3px] pl-2 pr-10 text-2xl leading-[1.33] outline-none focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1]"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-[#2271b1]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              {show ? (
                <path d="M17.2 3.3 3.3 17.2l-1-1L16.2 2.3l1 1ZM10 5c4 0 7 3.4 8 5-.4.7-1.3 1.8-2.5 2.9L13 10.4c0-.1 0-.3 0-.4a3 3 0 0 0-3-3l-.4.1L7.9 5.4C8.6 5.1 9.3 5 10 5Zm-6.6 2.2L6 9.6V10a4 4 0 0 0 4 4h.4l1.8 1.7c-.7.2-1.4.3-2.2.3-4 0-7-3.4-8-5 .3-.6.8-1.3 1.4-1.8Z" />
              ) : (
                <path d="M10 5c4 0 7 3.4 8 5-1 1.6-4 5-8 5s-7-3.4-8-5c1-1.6 4-5 8-5Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
              )}
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[13px]">
            <input type="checkbox" name="rememberme" value="forever" className="size-4" /> Ingat Saya
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-8 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 text-[13px] leading-[30px] text-white hover:bg-[#135e96] disabled:opacity-70"
          >
            {pending ? "Masuk..." : "Log Masuk"}
          </button>
        </div>
      </form>
    </>
  );
}
