"use client";

import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/actions/public";

type Variant = "band" | "widget" | "sidebar";

export default function SubscribeForm({ variant = "band" }: { variant?: Variant }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);

  const message = state && (
    <p role="status" className={`mt-2 text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
      {state.message}
    </p>
  );

  if (variant === "sidebar") {
    return (
      <form action={action}>
        <input
          type="email"
          name="email"
          required
          placeholder="Email Address"
          aria-label="Email Address"
          className="h-[51.6px] w-full rounded-[3px] border border-[#bdbdbd] bg-[#fafafa] p-3 text-base text-heading outline-none placeholder:text-[#757575] focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-5 h-[46px] w-[113px] rounded-[25px] border border-primary bg-primary text-base font-bold leading-4 text-white hover:bg-primary-dark disabled:opacity-60"
        >
          Submit
        </button>
        {message}
      </form>
    );
  }

  if (variant === "widget") {
    return (
      <form action={action} className="w-full">
        <input
          type="email"
          name="email"
          required
          placeholder="Alamat Email*"
          aria-label="Alamat Email"
          className="mt-1.5 h-11 w-full rounded-md border border-transparent bg-transparent px-3 py-2.5 text-base text-black outline-none placeholder:text-black focus:border-primary focus:bg-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-[46px] h-[46px] w-[135px] rounded-md border border-primary bg-primary text-base font-medium leading-6 text-white hover:bg-primary-dark disabled:opacity-60"
        >
          Berlangganan
        </button>
        {message}
      </form>
    );
  }

  return (
    <form action={action} className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <input
          type="email"
          name="email"
          required
          placeholder="Alamat Email*"
          aria-label="Alamat Email"
          className="mt-1.5 h-11 w-full rounded-md border border-transparent bg-transparent px-3 py-2.5 text-base text-black outline-none placeholder:text-black focus:border-primary focus:bg-white sm:max-w-[378px] sm:flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-1.5 shrink-0 rounded-md border border-primary bg-primary px-3.5 py-2.5 text-base text-white hover:bg-primary-dark disabled:opacity-60 sm:ml-auto sm:w-[181px]"
        >
          Berlangganan
        </button>
      </div>
      {message}
    </form>
  );
}
