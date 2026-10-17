/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOptions } from "@/lib/site";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Log Masuk ‹ infobanten.my.id", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(sp.redirect_to?.startsWith("/wp-admin") ? sp.redirect_to : "/wp-admin/");
  const site = await getOptions();

  return (
    <div className="min-h-screen bg-[#f0f0f1] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica_Neue',sans-serif] text-[#3c434a]">
      <div className="mx-auto w-[320px] pt-[8vh] pb-10">
        <h1 className="mb-6 flex justify-center">
          <Link href="/" title={site.blogname}>
            <img src="/images/logo.png" alt={site.blogname} width={84} height={84} className="size-[84px]" />
          </Link>
        </h1>
        {sp.loggedout && (
          <div className="mb-5 border-l-4 border-[#72aee6] bg-white px-3 py-3 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,.04)]">
            Anda sudah log keluar.
          </div>
        )}
        <LoginForm redirectTo={sp.redirect_to || "/wp-admin/"} />
        <p className="px-6 pt-6 text-[13px]">
          <Link href="/" className="text-[#50575e] hover:text-[#135e96]">
            ← Ke {site.blogname}
          </Link>
        </p>
      </div>
    </div>
  );
}
