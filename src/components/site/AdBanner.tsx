import { getOptions, whatsappLink } from "@/lib/site";

/** Banner "Pasang Iklan di Sini" (Figma 192:4756) */
export default async function AdBanner() {
  const { contactWhatsapp } = await getOptions();
  const href = whatsappLink(
    contactWhatsapp,
    "Halo Admin Info Banten, saya tertarik untuk pasang iklan di website. Bisa minta info lengkapnya?",
  );
  return (
    <section className="px-4 py-8 md:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 rounded-2xl bg-ad p-2.5 md:flex-row">
        <div className="relative h-[180px] w-full shrink-0 md:h-[204px] md:w-[295px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ad-girl.png"
            alt=""
            className="absolute bottom-0 left-1/2 h-[216px] w-[275px] max-w-none -translate-x-1/2 object-cover md:left-2.5 md:top-[-22px] md:translate-x-0"
          />
        </div>
        <div className="flex-1 p-2.5 text-center md:max-w-[550px] md:text-left">
          <p className="pb-6 font-heading text-base font-bold leading-5 text-primary">Pasang Iklan di Sini</p>
          <h3 className="font-heading text-2xl font-bold leading-[1.2] text-heading md:text-[32px] md:leading-[38.4px]">
            Jangkau Ribuan Pembaca di Wilayah Banten Setiap Hari
          </h3>
          <p className="pt-2 text-base leading-[25.6px] text-body">
            Tingkatkan penjualan bisnis Anda dengan promosi yang tepat sasaran. Harga bersahabat mulai dari{" "}
            <strong className="font-bold">Rp50rb/bulan</strong>.
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-end p-2.5 md:w-[295px] md:pr-8">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[46px] items-center justify-center rounded-[25px] border border-primary bg-primary px-7 text-base font-bold leading-4 text-white hover:bg-primary-dark"
          >
            Hubungi Admin
          </a>
        </div>
      </div>
    </section>
  );
}
