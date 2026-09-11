# TODO Checklist: Implementasi Proteksi & Keamanan Admin Panel
# jpXCode | jpxcode.pages.dev
Dokumen ini berisi panduan instruksi teknis untuk AI Agent/Developer dalam menerapkan lapisan keamanan perimeter (anti-copy/anti-inspect) dan keamanan inti (core security) pada halaman Admin Panel.

---

## 🛠️ Tahap 1: Proteksi Antarmuka (Front-End Perimeter)
*Tujuan: Menyulitkan pengguna awam melakukan inspeksi kode atau menyalin aset.*

- [x] **Implementasi Script Anti-Klik Kanan (Context Menu)**
  - Menghentikan event `contextmenu` di seluruh dokumen dengan `e.preventDefault()`.
- [x] **Implementasi Blokir Shortcut Developer Tools**
  - Menangkap event `keydown` untuk memblokir tombol berikut:
    - `F12` (Membuka DevTools).
    - `Ctrl + Shift + I` atau `Cmd + Option + I` (Inspect Element).
    - `Ctrl + Shift + J` atau `Cmd + Option + J` (Buka Konsol).
    - `Ctrl + Shift + C` atau `Cmd + Option + C` (Pilih Elemen).
    - `Ctrl + U` atau `Cmd + Option + U` (View Source Code).
- [x] **Implementasi DevTools Detection Loop (Debugger Trap)**
  - Menambahkan interval `setInterval` menggunakan pernyataan `debugger` untuk mendeteksi jeda eksekusi script.
  - Mengarahkan ulang (*redirect*) halaman ke `about:blank` jika terdeteksi adanya keterlambatan eksekusi akibat DevTools terbuka.
- [x] **Penerapan Tailwind Utility Anti-Select**
  - Menambahkan kelas CSS Tailwind `select-none` pada elemen penampung utama (`<body>` atau `<div>` root) agar teks tidak dapat diblok/disalin.
  - Memanfaatkan utilitas `selection:bg-transparent` untuk menyembunyikan visual highlight saat teks dicoba untuk dipilih.

---

## 🔒 Tahap 2: Pengacakan Kode & Aset (Code Obfuscation)
*Tujuan: Memastikan kode JavaScript yang terunduh di browser tidak dapat dibaca secara langsung oleh manusia.*

- [x] **Integrasi JavaScript Obfuscator**
  - Mengonfigurasi modul `javascript-obfuscator` pada alur build (Webpack, Vite, atau script otomatis).
  - Mengaktifkan fitur:
    - `compact: true` (menghapus spasi dan baris baru).
    - `controlFlowFlattening: true` (mengacak alur logika eksekusi kode).
    - `deadCodeInjection: true` (menyisipkan kode palsu untuk mengecoh analisis manual).
    - `stringArrayEncoding: ['rc4']` atau `['base64']` (menyembunyikan string sensitif/URL API).
  - **TERPASANG (2026-09-11):** `scripts/build-secure.mjs` — 9 file JS diobfuscate
    (guard, site-live, chat-widget, schema-seo, ga4-loader, ui-main, booking, admin, supabase-config)
    dengan `selfDefending` + `domainLock` (vercel.app + timurabadi-fiber.com) — script mati total
    jika di-copy ke domain lain. Sumber plaintext hanya di `assets/js/src/` (di-.vercelignore).
  - Build ulang: `npm run build:secure` (atau `TAF_QA=1 npm run build:secure` untuk QA lokal).

- [x] **HTML/CSS Crypt (TAHAP 2 — 2026-09-12)**
  - `scripts/build-htmlcrypt.mjs`: seluruh halaman (index, proposal, admin, 404,
    blocked) di-strip komentar dev, di-minify satu baris, email & hex warna
    diobfuscate, banner anti-clone disuntik. `assets/css/tw.css` di-minify ulang.
  - SEO aman: title, meta description/og/canonical, heading, alt, konten teks
    TIDAK diubah (QA: title+canonical+description lolos).
  - Build ulang: `npm run build:htmlcrypt`.

- [x] **Watermark Gambar + Img Shield (TAHAP 2 — 2026-09-12)**
  - `scripts/build-watermark.mjs` (sharp): 22 foto proyek di-bake watermark
    ganda — teks diagonal "CV. TIMUR ABADI FIBER" + dither 1-bit frekuensi
    tinggi yang muncul saat foto di-reencode/screenshot/adjust-level.
  - `assets/js/src/img-shield.js` (obfuscated): 13 foto di index dirender via
    canvas + overlay watermark kedua saat runtime — "Save As" hanya menghasilkan
    file ber-watermark; drag & contextmenu diblokir; logo klien pihak ketiga
    di-exempt. Lazy-load ditangani via IntersectionObserver.
  - Master asli (card.png, hero-waterpark.jpg, tw-src.css, style.css) diblokir
    dari akses publik via vercel.json → /blocked.
  - Build ulang: `npm run build:watermark`.

---

## 🛡️ Tahap 3: Keamanan Inti Sisi Server (Back-End Core Security)
*PENTING: Jangan mengandalkan proteksi front-end untuk menyembunyikan data sensitif.*

- [x] **Validasi Autentikasi Sesi (Server-Side Session Validation)**
  - Memastikan server menolak pengiriman file HTML Admin Panel jika request tidak menyertakan cookie sesi (*Session Cookie*) atau token JWT yang valid.
  - Mengembalikan status HTTP `401 Unauthorized` atau `403 Forbidden` alih-alih merender halaman bagi pengguna anonim.
- [x] **Penerapan Header Security (Content Security Policy - CSP)**
  - Mengonfigurasi server untuk mengirimkan header `Content-Security-Policy` yang ketat.
  - Membatasi eksekusi inline script yang tidak terotorisasi demi mencegah eksploitasi celah Cross-Site Scripting (XSS).
- [x] **Implementasi IP Whitelisting (Opsional / Kondisional)**
  - Membatasi akses ke endpoint direktori `/admin` hanya untuk alamat IP statis yang telah didaftarkan (IP kantor atau VPN internal).

---

## 📌 Catatan Penting untuk Agent
> **Prinsip Dasar:** Semua taktik penyembunyian kode di sisi klien (*Front-End*) hanya berfungsi sebagai lapisan pencegah awal (*deterrent*). Validasi hak akses, perlindungan database, dan otorisasi mutlak harus tetap dikelola dengan ketat di sisi server (*Back-End*).
