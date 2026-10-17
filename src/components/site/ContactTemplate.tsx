/* eslint-disable @next/next/no-img-element */
import { getOptions, whatsappLink } from "@/lib/site";

/** Halaman Kontak (Figma 192:6222 + 192:6271) */
export default async function ContactTemplate() {
  const { contactPhone, contactWhatsapp } = await getOptions();
  const cards = [
    {
      icon: "/images/icon-news-tips.svg",
      title: "News Tips",
      text: "Punya informasi atau peristiwa penting di sekitar Anda? Kirimkan kabar dan dokumentasinya kepada redaksi kami melalui",
      link: { label: "WhatsApp redaksi", href: whatsappLink(contactWhatsapp, "Halo Redaksi Info Banten, saya ingin mengirim info berita:") },
    },
    {
      icon: "/images/icon-megaphone.svg",
      title: "Advertising & Sponsorships",
      text: "Promosikan bisnis Anda kepada ribuan pembaca di wilayah Banten. Paket iklan mulai dari Rp50rb/bulan,",
      link: {
        label: "hubungi admin",
        href: whatsappLink(contactWhatsapp, "Halo Admin Info Banten, saya tertarik untuk pasang iklan di website. Bisa minta info lengkapnya?"),
      },
    },
    {
      icon: "/images/icon-pen.svg",
      title: "Be a Guest Author",
      text: "Kami membuka kesempatan bagi akademisi, mahasiswa, dan komunitas untuk menulis artikel atau rilis kegiatan. Kirim tulisan Anda lewat",
      link: { label: "WhatsApp redaksi", href: whatsappLink(contactWhatsapp, "Halo Redaksi Info Banten, saya ingin mengirim tulisan/rilis kegiatan.") },
    },
  ];

  return (
    <>
      <section className="bg-white p-2.5">
        <div className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <img src="/images/contact-bg.png" alt="" className="absolute left-[55.19%] top-0 h-full w-[44.81%] max-w-none" />
            <img src="/images/contact-overlay.png" alt="" className="absolute left-0 top-0 h-full w-[69.55%] max-w-none opacity-50" />
          </div>
          <div className="relative mx-auto flex max-w-[1200px] flex-col gap-1 px-4 pb-12 pt-[110px] md:pt-[150px] lg:flex-row">
            <div className="flex flex-col gap-5 py-2.5 lg:w-[396px] lg:shrink-0 lg:pl-2.5 lg:pr-[95px]">
              <div>
                <h1 className="pb-7 font-heading text-5xl font-bold leading-[1.4] text-heading md:text-[64px] md:leading-[89.6px]">Contact</h1>
                <div className="mb-7 border-t border-white" />
              </div>
              <h2 className="pb-5 font-heading text-2xl font-bold leading-[28.8px] text-heading">Info Banten</h2>
              <p className="flex items-center pb-[47px] text-base leading-[25.6px] text-heading">
                <img src="/images/icon-pin.svg" alt="" width={14} height={14} className="mr-[13px]" />
                Banten
              </p>
              <h3 className="pb-5 font-heading text-xl font-bold leading-6 text-heading">Customer Service</h3>
              <a
                href={whatsappLink(contactWhatsapp, "Halo Admin Info Banten")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-base leading-[25.6px] text-heading hover:text-primary"
              >
                <img src="/images/icon-phone.svg" alt="" width={14} height={14} className="mr-[13px]" />
                {contactPhone}
              </a>
            </div>
            <div className="flex items-end p-2.5 lg:w-[800px]">
              <iframe
                title="Peta Banten"
                src="https://www.google.com/maps?q=Banten,+Indonesia&z=8&output=embed"
                loading="lazy"
                className="h-[300px] w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 md:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-8 border-y border-line px-2.5 pb-8 pt-12 md:grid-cols-3 md:gap-1">
          {cards.map((c) => (
            <div key={c.title} className="py-2.5 pl-2.5 md:pr-12">
              <img src={c.icon} alt="" width={24} height={39} className="h-[39px] w-6" />
              <h3 className="pt-[7px] font-heading text-xl font-bold leading-6 text-heading">{c.title}</h3>
              <p className="pt-[15px] text-base leading-[25.6px] text-body">
                {c.text}{" "}
                <a href={c.link.href} target="_blank" rel="noopener noreferrer" className="text-heading underline-offset-2 hover:text-primary hover:underline">
                  {c.link.label}
                </a>
                .
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
