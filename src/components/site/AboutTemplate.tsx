/* eslint-disable @next/next/no-img-element */
import AdBanner from "./AdBanner";

const STATS = [
  { icon: "/images/icon-rss.svg", value: "1k+", label: "Pembaca Setia" },
  { icon: "/images/icon-user.svg", value: "5K+", label: "Kunjungan Bulanan" },
  { icon: "/images/icon-newspaper.svg", value: "10k+", label: "Tayangan Halaman" },
];

/** Halaman Tentang (Figma 192:5266) */
export default function AboutTemplate() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-16 pt-[110px] md:px-10 md:pt-[150px]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img src="/images/about-bg.png" alt="" className="absolute inset-0 size-full max-w-none object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white" />
        </div>
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-1 lg:flex-row">
          <div className="flex flex-col gap-5 pt-2.5 lg:w-[396px] lg:shrink-0 lg:pl-2.5 lg:pr-[50px]">
            <h1 className="font-heading text-5xl font-bold leading-[1.4] text-heading md:text-[64px] md:leading-[89.6px]">Tentang Kami</h1>
            <p className="text-base leading-[26px] text-[#333]">
              <strong className="font-bold">Info Banten</strong> hadir sebagai platform media digital terpercaya yang menyajikan informasi
              terkini, akurat, dan mendalam seputar wilayah Banten. Kami berkomitmen untuk menjadi jembatan informasi yang mengedukasi
              serta menginspirasi masyarakat mulai dari Serang, Tangerang, Cilegon, hingga pelosok Pandeglang dan Lebak.
            </p>
            <div className="mt-6 border-t border-white" />
          </div>
          <div className="flex flex-col gap-5 p-2.5 lg:w-[800px]">
            <img src="/images/about-team.png" alt="Tim redaksi Info Banten" width={780} height={455} className="h-auto w-full object-cover md:h-[455px]" />
            <div className="grid gap-6 border-b border-line px-2.5 pb-6 pt-6 sm:grid-cols-3 sm:gap-[62px]">
              {STATS.map((s) => (
                <div key={s.label} className="flex items-start">
                  <img src={s.icon} alt="" width={30} height={24} className="mr-2.5 h-6 w-[30px]" />
                  <div>
                    <p className="font-heading text-2xl font-bold leading-[28.8px] text-heading">{s.value}</p>
                    <p className="whitespace-nowrap text-base leading-[25.6px] text-body">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4 pt-6 text-base leading-[25.6px] text-body md:pr-16">
              <p>
                Di era banjir informasi digital, <strong className="font-bold">Info Banten</strong> lahir dengan semangat untuk memberikan
                konten yang bersih dari hoaks dan relevan dengan kebutuhan warga Banten. Kami percaya bahwa setiap peristiwa di tanah
                Banten memiliki cerita yang patut dibagikan, mulai dari dinamika Politik, geliat Ekonomi kreatif, kekayaan Kuliner khas,
                hingga potensi Wisata yang belum terjamah.
              </p>
              <p>
                Kami bekerja dengan integritas untuk menyajikan berita dari sudut pandang lokal yang tajam namun tetap berimbang. Melalui
                kategori yang beragam seperti Pendidikan dan Peristiwa, kami bertujuan untuk mencerdaskan pembaca sekaligus
                mempromosikan potensi daerah ke kancah nasional.
              </p>
              <p>
                Sebagai media yang tumbuh di era modern, kami juga membuka ruang kolaborasi bagi komunitas, pelaku UMKM, dan instansi
                untuk bertumbuh bersama. <strong className="font-bold">Info Banten</strong> bukan sekadar portal berita, melainkan teman
                bagi masyarakat Banten dalam mencari referensi harian yang terpercaya.
              </p>
              <p>
                Kami akan terus berinovasi untuk menghadirkan pengalaman membaca yang nyaman dan responsif bagi Anda, baik melalui
                desktop maupun perangkat mobile. Terima kasih telah menjadikan <strong className="font-bold">infobanten.my.id</strong>{" "}
                sebagai rujukan informasi Anda.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="py-[18px]">
        <AdBanner />
      </div>
    </>
  );
}
