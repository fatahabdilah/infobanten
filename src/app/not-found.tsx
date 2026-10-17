import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-xl text-center">
          <p className="font-heading text-7xl font-bold text-primary">404</p>
          <h1 className="mt-4 font-heading text-3xl font-bold text-heading">Halaman tidak ditemukan</h1>
          <p className="mt-3 text-body">Sepertinya halaman yang Anda cari sudah dipindahkan atau tidak ada. Coba cari berita lain:</p>
          <form action="/" method="get" className="mt-6 flex gap-2">
            <input type="search" name="s" placeholder="Cari berita..." className="h-12 flex-1 rounded-[2px] border border-line-strong bg-white px-4 outline-none focus:border-primary" />
            <button className="h-12 rounded-[25px] bg-primary px-6 font-bold text-white">Cari</button>
          </form>
          <Link href="/" className="mt-6 inline-block font-bold text-primary">← Kembali ke Beranda</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
