# Info Banten — Next.js

Migrasi **infobanten.my.id** dari WordPress ke Next.js 15, dengan tampilan sesuai desain Figma dan panel admin bergaya WordPress.

- Semua URL lama tetap sama: `/{slug}/`, `/category/{slug}/`, `/tag/{slug}/`, `/author/{slug}/`, `/page/2/`, `/?p=ID`, `/?s=cari`, `/feed/`, `/sitemap_index.xml` (format Rank Math), dan file `/wp-content/uploads/...`.
- Admin di `/wp-admin/`, login di `/wp-login.php`. Admin khusus untuk berita (pos), media, komentar, dan pengguna.
- Halaman statis ditulis langsung di kode: Beranda (`src/app/(site)/page.tsx`), Tentang (`src/components/site/AboutTemplate.tsx`), Kontak (`src/components/site/ContactTemplate.tsx`), Podcast (`src/app/(site)/podcast/page.tsx`). Untuk mengubah isinya, edit file tersebut lalu deploy ulang.
- Pratinjau link WhatsApp/Facebook: setiap artikel punya `og:image` 1200×630 JPEG terkompresi (`/og/{id}.jpg`) dari gambar unggulan.
- Favicon, apple-touch-icon, ikon PWA, dan gambar OG default dibuat dari logo (`npm run icons`).

## Supabase

Database memakai **Supabase Postgres** (lewat Prisma) dan file media memakai **Supabase Storage** (bucket publik `uploads`). URL gambar tetap `/wp-content/uploads/2026/10/foto.jpg` karena Next.js mem-proxy path itu ke Storage, jadi tautan gambar lama tetap jalan.

1. Buat project di [supabase.com](https://supabase.com/dashboard).
2. Salin `.env.example` ke `.env`, lalu isi:
   - `DATABASE_URL` dan `DIRECT_URL`: dari **Connect → ORMs → Prisma**
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`: dari **Project Settings → API**
3. Jalankan:

```bash
npm install
npm run db:push        # membuat tabel di Supabase
npm run import:wp      # memindahkan semua berita + mengunggah semua file media ke Storage (bucket dibuat otomatis)
npm run dev
```

Buka http://localhost:3000. Admin ada di http://localhost:3000/wp-login.php (user `admin`, password = `ADMIN_PASSWORD`).

`import:wp` bisa dijalankan ulang kapan saja. Isinya diganti dengan data terbaru dari WordPress. File yang sudah ada di folder cache `storage/uploads` atau di Storage tidak diunduh/diunggah ulang. **Peringatan:** konten yang dibuat di Next.js akan ikut terhapus, jadi jalankan hanya sebelum pindah domain.

Upload dari admin dikirim langsung dari browser ke Supabase Storage (signed URL), jadi tidak terkena batas ukuran request di Vercel. Ukuran thumbnail/medium/large dibuat otomatis seperti WordPress.

Jika `SUPABASE_URL` dikosongkan, file disimpan di folder `UPLOAD_DIR`. Ini berguna untuk development tanpa Storage.

## Fitur admin (mirip WordPress)

| Menu | URL | Isi |
|---|---|---|
| Dasbor | `/wp-admin/` | Sekilas, Aktivitas, Draf Cepat |
| Pos | `edit.php` | Filter status, cari, filter kategori, bulk action, tong sampah, paginasi |
| Editor | `post-new.php`, `post.php?post=ID&action=edit` | Editor blok bergaya Gutenberg, editor kode HTML, kategori, tag, gambar unggulan, kutipan, jadwal terbit, slug, SEO + pratinjau WhatsApp/Google, panel pra/pasca terbit, Ctrl/Cmd+S |
| Kategori / Tag | `edit-tags.php?taxonomy=category` | Tambah, sunting, hapus, induk kategori |
| Media | `upload.php`, `media-new.php` | Pustaka grid, unggah drag & drop, alt/judul/keterangan, ukuran otomatis (thumbnail/medium/large) |
| Komentar | `edit-comments.php` | Setujui, tolak, balas, spam, buang |
| Pelanggan | `/wp-admin/subscribers/` | Email dari formulir “Langganan Berita Terbaru”, ekspor CSV |
| Pengguna | `users.php`, `user-new.php`, `profile.php` | Peran Administrator/Editor/Author/Contributor/Subscriber |
| Pengaturan | `options-general.php` | Judul, slogan, nomor WhatsApp admin, jumlah pos per halaman, moderasi komentar |

Jika slug pos yang sudah terbit diganti, URL lama otomatis di-redirect permanen ke URL baru.

Pos lama dari WordPress yang berisi blok kompleks (tabel, kolom, embed Spectra) otomatis dibuka di **Editor kode** supaya formatnya tidak rusak.

## Deploy

### Vercel (disarankan bersama Supabase)

1. Import repo di Vercel.
2. Isi semua variabel dari `.env.example` di **Settings → Environment Variables**. `SITE_URL` diisi `https://infobanten.my.id`.
3. Deploy. `prisma generate` berjalan otomatis lewat `postinstall`.
4. Tambahkan domain `infobanten.my.id` di **Settings → Domains**.

Database dan file media ada di Supabase, jadi server tidak perlu menyimpan data apa pun. `vercel.json` menempatkan fungsi di region Tokyo (`hnd1`), sama dengan database Supabase (`ap-northeast-1`), supaya query cepat.

### VPS / server Node.js

```bash
npm ci && npm run build
npx pm2 start "npm start -- -p 3000" --name infobanten
```

Pasang reverse proxy Nginx ke port 3000 (`client_max_body_size 25M;`) dan SSL. `SITE_URL` serta `SUPABASE_URL` dipakai saat build. Jika diganti, jalankan `npm run build` lagi.

### Langkah pindah domain

1. Deploy, lalu uji lewat domain sementara (misalnya `*.vercel.app`).
2. Tepat sebelum pindah, jalankan `npm run import:wp` sekali lagi supaya artikel terbaru di WordPress ikut terbawa.
3. Arahkan DNS `infobanten.my.id` ke server baru dan pasang SSL (`certbot --nginx`).
4. Cek pratinjau link di [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) dan klik **Scrape Again**. WhatsApp menyimpan cache pratinjau lama, jadi link yang pernah dibagikan bisa butuh waktu sebelum berubah.
5. Kirim ulang `https://infobanten.my.id/sitemap_index.xml` di Google Search Console.

### Backup

Supabase mem-backup database harian (paket Pro: point-in-time). File media ada di bucket `uploads`.

## Struktur

```
src/app/(site)/        halaman publik (beranda, [slug], category, tag, author, page/n, preview)
src/app/wp-admin/      panel admin
src/app/wp-login/      halaman login (/wp-login.php)
src/app/og/            gambar og:image untuk WhatsApp/Facebook
src/app/wp-content/    menyajikan file upload dengan path WordPress
src/components/site/   komponen tampilan (sesuai Figma)
src/components/admin/  komponen admin (menu, tabel, media, editor)
scripts/import-wp.ts   migrasi dari WordPress REST API
```
