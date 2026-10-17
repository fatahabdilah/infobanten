import Link from "next/link";
import SubscribeForm from "./SubscribeForm";

const COMPANY = [
  { label: "Tentang", href: "/tentang/" },
  { label: "Kontak", href: "/kontak/" },
  { label: "Our Staff", href: "#" },
  { label: "Advertise", href: "#" },
];
const TECH = ["Technology", "Gadget", "Software", "Games"];
const LEGAL = ["Privacy Policy", "Terms of Service", "Extra Crunch Terms", "Code of Conduct"];

export default function Footer() {
  return (
    <footer>
      <section id="berlangganan" className="relative min-h-[252px] scroll-mt-4 overflow-hidden px-4 py-12 md:px-10 md:py-[72px]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/footer-bg.png" alt="" className="absolute left-0 top-0 h-full w-[41.6%] max-w-none object-cover" />
          <div className="absolute inset-0 bg-[rgba(142,251,218,0.64)]" />
        </div>
        <div className="relative mx-auto grid max-w-[1200px] gap-6 md:grid-cols-2 md:gap-[50px]">
          <div>
            <h2 className="font-heading text-[28px] font-bold leading-[1.25] text-heading md:text-[40px] md:leading-[50px]">
              Langganan Berita Terbaru
            </h2>
            <p className="text-base leading-[25.6px] text-body">
              Dapatkan update berita terpercaya dan peristiwa penting di seputar Banten langsung di email Anda setiap hari.
            </p>
          </div>
          <div className="md:py-4">
            <SubscribeForm />
          </div>
        </div>
      </section>

      <div className="bg-page px-4 pb-10 pt-16 md:px-10 md:pt-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-[50px] gap-y-10 md:grid-cols-4">
          <div className="col-span-2 flex justify-center pb-2.5 md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-footer.png" alt="Info Banten" width={100} height={100} className="size-[100px] object-cover" />
          </div>
          <div>
            <p className="text-xl font-bold leading-[25.6px] text-heading">Company</p>
            <ul className="pt-5">
              {COMPANY.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-base leading-[25.6px] text-body hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <FooterMenu title="Tech News" items={TECH} />
          <FooterMenu title="Legal" items={LEGAL} />
        </div>
      </div>

      <div className="border-t border-line bg-page px-4 py-5 md:px-10">
        <p className="text-center text-sm leading-[25.6px] text-body">Copyright © {new Date().getFullYear()} infobanten.my.id.</p>
      </div>
    </footer>
  );
}

function FooterMenu({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-heading text-xl leading-[30px] text-heading">{title}</h2>
      <ul className="pt-5">
        {items.map((label) => (
          <li key={label}>
            <a href="#" className="text-base leading-[25.6px] text-body hover:text-primary">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
