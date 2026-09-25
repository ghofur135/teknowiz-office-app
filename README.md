# WizBilling - TeknoWiz Invoice & Billing Management System

Sistem aplikasi mandiri (*standalone micro-app*) manajemen faktur tagihan (*invoice*), surat penawaran harga (*quotation*), pencatatan transaksi kas, dan kwitansi pembayaran resmi (*receipt*) untuk **PT Tekno Wiz Indonesia**.

---

## 🏢 Identitas Resmi Perusahaan

* **Badan Usaha**: **PT Tekno Wiz Indonesia**
* **Slogan**: *Membangun Ekosistem Digital Berkelanjutan*
* **Domisili**: Slawi, Kabupaten Tegal, Jawa Tengah, Indonesia (52411)
* **Kontak**: `halo@teknowiz.id` | WhatsApp: `+62 878 1127 8630` | Web: `https://teknowiz.id`
* **Rekening Resmi**: **Bank Mandiri** `138-00-2299881-1` a.n. **PT TEKNO WIZ INDONESIA**
* **NPWP Badan**: `31.849.201.8-501.000` | **NIB**: `0220109123456`
* **Desain UI**: *Corporate Clean* (Slate 900 `#0F172A`, Sky Blue `#0284C7`), **bebas glassmorphism / gradient blobs / neon glow**, dengan presisi cetak 1 lembar A4 (`@media print`).
* **Aset Resmi Terpasang**:
  * Logo Perusahaan: `public/images/logo.png`
  * Gambar Banner Login: `public/images/login-banner.png`
  * Stempel Basah PT: `public/images/stamp-teknowiz.png`

---

## 🔐 Kredensial Login Resmi (Authentication)

Sistem telah dilengkapi dengan portal otentikasi login resmi dan proteksi route (Middleware):
* **Halaman Login**: `http://localhost:3000/login`
* **Email / Username**: `dhimas@teknowiz.id`
* **Kata Sandi (Password)**: `Teknowiz26#!`
* **Nama Pengguna**: Dhimas Ghofur A. F. (Direktur Utama / Admin)

---

## 🚀 Fitur Utama Sistem

1. **Dashboard Overview Keuangan**
   * Metrik KPI realtime: Total Omzet Bulan Ini, Piutang Tertunda (*Unpaid/Overdue*), dan Kas Masuk (*Cash Inflow*).
   * Peringatan faktur jatuh tempo otomatis beserta tombol shortcut pengingat WhatsApp ke PIC klien.
   * Tabel transaksi terbaru dan menu pintasan dokumen.

2. **Manajemen Faktur Tagihan (Invoices)**
   * Format penomoran otomatis berurutan per bulan: `INV/TW/YYYYMM/000` dengan sistem locking sequence bebas nomor ganda/lompat.
   * Kalkulasi finansial komprehensif: Subtotal, Diskon Item, Diskon Global (Fixed / Persen), DPP, PPN (11% / 12%), dan potongan PPh 23 (2%).
   * Filter status dinamis: *Draft, Terkirim (Sent), Sebagian (Partial), Lunas (Paid), Jatuh Tempo (Overdue), Dibatalkan (Cancelled)*.
   * Tombol *Share WhatsApp* dengan teks pesan penagihan otomatis yang rapi.
   * Pratinjau & Cetak A4 beresolusi tinggi dengan QR Code verifikasi dokumen.

3. **Surat Penawaran Harga (Quotations)**
   * Format penomoran resmi: `QUO/TW/YYYYMM/000`.
   * Memuat masa berlaku penawaran, termin pembayaran, dan spesifikasi paket layanan.
   * **Konversi 1-Klik ke Invoice (*Convert to Invoice*)**: Otomatis membuat faktur `INV/TW/...` baru, menyalin seluruh baris item, dan mereferensikan nomor penawaran asal.
   * Cetak Surat Penawaran A4 resmi lengkap dengan kolom persetujuan (*Client Acceptance Sign Block*).

4. **Buku Kwitansi Resmi & Pembayaran (Official Receipts)**
   * Format penomoran resmi: `KWT/TW/YYYYMM/000`.
   * **Generator Terbilang Otomatis**: Parser angka rupiah ke teks bahasa Indonesia (contoh: `Rp 15.000.000` ➡️ *"Lima Belas Juta Rupiah"*).
   * Pencatatan pembayaran parsial (DP / Termin) dan pelunasan. Sistem otomatis menghitung sisa tagihan (*balance due*) dan mengubah status faktur menjadi *PARTIAL* atau *PAID*.
   * Cetak Kwitansi Resmi A4 berbingkai formal ganda, kotak nominal rupiah, kotak meterai tempel (jika $\ge$ Rp 5.000.000), dan stempel digital.

5. **Master Data Klien (Mini-CRM)**
   * Manajemen klien instansi B2G (Pemda, RSUD), korporasi B2B, dan UMKM.
   * Menyimpan kode klien otomatis (`CLI-YYYY-000`), nama instansi, nama & WhatsApp PIC, email, NPWP, dan alamat.

6. **Katalog Produk SaaS & Jasa IT**
   * Katalog layanan bawaan TeknoWiz:
     * *PulseTV Control - Cloud Signage*
     * *Wizly - Smart Helpdesk & Ticketing*
     * *WizPortal - Enterprise Intranet & SSO*
     * *InfraMate - Server & Network Monitoring*
     * *DaganganGO - POS & Inventory Omnichannel*
     * *TeknoPharm - SIM Farmasi & Klinik Bridging SatuSehat*
     * *Jasa Konsultasi TI, Integrasi API B2G, & Maintenance Tahunan*.

7. **Pengaturan Identitas Legal & Rekening PT**
   * Form pengaturan profil perusahaan, domisili, email/telepon, NPWP, NIB, dan rekening perbankan penampung tagihan yang tersinkronisasi ke seluruh dokumen cetak.

---

## 🛠️ Tech Stack & Arsitektur

* **Framework**: Next.js 14 (App Router & Route Handlers)
* **Bahasa**: TypeScript
* **Database**: SQLite 3 (`@libsql/client`) dengan mode **WAL (Write-Ahead Logging)** dan `busy_timeout` untuk konkurensi optimal tanpa konfigurasi rumit.
* **Styling**: Tailwind CSS + Lucide React Icons (Corporate Clean styling)
* **Print Engine**: Pixel-Perfect High-Res Browser Print CSS (`@page { size: A4; margin: 10mm 12mm; }`)

---

## 📂 Struktur Direktori Proyek

```text
teknowiz-office-app/
├── data/
│   └── billing.sqlite3              # Database SQLite lokal (WAL mode)
├── scripts/
│   ├── seed.js                      # Script inisialisasi & demo data
│   ├── restore-vps.js               # CLI interaktif auto-restore data ke VPS (SSH/SFTP)
│   ├── backup.js                    # Pembuat snapshot arsip lokal (.tar.gz)
│   └── vps-deploy.sh                # Script runner deploy otomatis PM2 di VPS
├── ecosystem.config.js              # Konfigurasi resmi PM2 production Next.js
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Layout dashboard dengan Sidebar
│   │   │   ├── page.tsx             # Dashboard KPI & Ringkasan Transaksi
│   │   │   ├── invoices/            # Modul Faktur Tagihan
│   │   │   ├── quotations/          # Modul Surat Penawaran
│   │   │   ├── receipts/            # Buku Kwitansi Resmi
│   │   │   ├── clients/             # Master Klien (Mini-CRM)
│   │   │   ├── products/            # Katalog Produk & Jasa
│   │   │   ├── legality/            # Arsip Dokumen Legalitas PT (Akta, NIB, NPWP, SK)
│   │   │   └── settings/            # Pengaturan PT & Rekening
│   │   ├── print/
│   │   │   ├── invoice/[id]/        # Layout Cetak A4 Faktur Tagihan
│   │   │   ├── quotation/[id]/      # Layout Cetak A4 Surat Penawaran
│   │   │   └── receipt/[id]/        # Layout Cetak A4 Kwitansi Sah
│   │   ├── verify/                  # Portal Verifikasi Publik Dokumen (Online Mode)
│   │   ├── api/                     # Backend API Handlers (Auth, Docs, Verify, Legality)
│   │   ├── globals.css              # Corporate styles & @media print A4
│   │   └── layout.tsx               # Root Layout & Favicon Metadata
│   ├── components/                  # Komponen UI Reusable
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── DocumentForm.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── CompanyBadge.tsx
│   │   ├── OfficialStamp.tsx        # Render stempel resmi PT dengan efek wet ink
│   │   └── DocumentQrCode.tsx
│   └── lib/                         # Logika Bisnis & Utilitas
│       ├── db.ts                    # SQLite LibSQL connection & init
│       ├── types.ts                 # TypeScript domain types
│       ├── calculator.ts            # Formula perhitungan PPN/PPh 23/Diskon
│       ├── terbilang.ts             # Parser Rupiah ke teks Indonesia
│       └── number-generator.ts      # Generator nomor urut QUO/INV/KWT
├── public/
│   ├── favicon.ico                  # Favicon fallback browser
│   └── images/
│       ├── favicon.png              # Favicon resmi TeknoWiz (TW monogram)
│       ├── logo.png                 # Logo resmi PT Tekno Wiz Indonesia
│       ├── login-banner.png         # Banner visual korporat halaman login
│       └── stamp-teknowiz.png       # Stempel basah resmi PT Tekno Wiz Indonesia
├── package.json
└── tsconfig.json
```

---

## ⚡ Panduan Menjalankan Aplikasi

### 1. Prasyarat
* Node.js versi 18 atau lebih baru (Disarankan Node.js v20+)
* npm

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env.local` atau `.env`:
```bash
cp .env.example .env.local
```
Variabel yang dapat dikonfigurasi:
* `NEXT_PUBLIC_APP_URL`: URL publik aplikasi (contoh: `https://billing.teknowiz.id`). Digunakan untuk tautan verifikasi online barcode. *(Catatan: URL ini juga bisa diubah langsung dari web UI melalui menu **Pengaturan PT**)*.
* `SESSION_SECRET`: Kunci rahasia untuk HMAC enkripsi session login.
* `LIBSQL_URL` & `LIBSQL_AUTH_TOKEN`: *(Opsional)* Jika ingin menghubungkan ke database Turso Cloud SQLite.

### 3. Inisialisasi Data Demo
Jalankan perintah berikut untuk mengisi master data default (Profil PT Tekno Wiz, Klien awal, Katalog SaaS, dan sampel transaksi):

```bash
npm run seed
```

### 4. Menjalankan di Mode Pengembangan (Development)
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 5. Build untuk Produksi
```bash
npm run build
npm start
```

---

## 🚀 Migrasi & Auto-Restore ke VPS

Untuk memindahkan database lokal (`data/billing.sqlite3`) beserta seluruh berkas dokumen legalitas resmi (`public/uploads/legality/*.pdf`) ke server VPS tanpa perlu re-upload manual di web:

### Opsi A: Auto Restore via Script SSH/SFTP (Rekomendasi)
Cukup jalankan satu perintah berikut di terminal komputer lokal:
```bash
npm run restore:vps
```
Script interaktif akan meminta input:
1. **IP VPS / Hostname** (Wajib)
2. **Port SSH** (Default: `22`)
3. **Username SSH** (Default: `root`)
4. **Password SSH** (Wajib, input ter-masking `*` demi keamanan)
5. **Direktori Aplikasi di VPS** (Default: `/var/www/teknowiz-office-app`)

Script otomatis:
* Melakukan `PRAGMA wal_checkpoint(TRUNCATE)` pada SQLite lokal agar data 100% tersinkron.
* Membuat folder tujuan di VPS jika belum ada (`mkdir -p`).
* Mengunggah `data/billing.sqlite3` dan seluruh file PDF legalitas via SFTP.
* Mengatur *permission* Linux (`chmod 755` & `chmod 644`).
* Melakukan auto-reload PM2 jika terdeteksi di VPS.

### Opsi B: Backup Bundler Manual (.tar.gz)
Untuk membuat arsip snapshot lengkap (database + uploads):
```bash
npm run backup
```
File arsip tersimpan di folder `backups/wizbilling-backup-*.tar.gz`. Di VPS cukup jalankan:
```bash
tar -xzf wizbilling-backup-*.tar.gz
```

---

## ⚡ Menjalankan Aplikasi di VPS dengan PM2

Aplikasi ini telah dilengkapi dengan konfigurasi resmi PM2 [`ecosystem.config.js`](./ecosystem.config.js) yang dioptimasi khusus untuk Next.js 14 & SQLite:
* `watch: false` & `ignore_watch`: Mencegah server me-restart sendiri saat database SQLite menulis data atau ada dokumen upload baru.
* `max_memory_restart: '512M'`: Menjaga stabilitas memori server.
* `logs/`: Mengarahkan log error & stdout ke direktori logs dengan format timestamp.

### 1. Cara Cepat: Sekali Jalan via Script Deploy
Di dalam folder aplikasi di VPS:
```bash
npm run vps:deploy
```
*(Script ini otomatis mengecek PM2, install deps, build Next.js, start/reload PM2, dan menjalankan `pm2 save`).*

### 2. Perintah Kontrol PM2
```bash
npm run pm2:start    # Menjalankan aplikasi di background via PM2
npm run pm2:logs     # Memantau realtime logs aplikasi
npm run pm2:status   # Memeriksa status proses & penggunaan RAM
npm run pm2:restart  # Restart aplikasi
npm run pm2:reload   # Reload zero-downtime
npm run pm2:stop     # Menghentikan proses
```

### 3. Konfigurasi Nginx Reverse Proxy (Opsional / Rekomendasi Domain)
Buat file konfigurasi `/etc/nginx/sites-available/teknowiz-billing`:
```nginx
server {
    server_name billing.teknowiz.id; # Ganti dengan domain Anda

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 25M; # Agar aman saat upload dokumen legalitas PDF
}
```
Aktifkan dan pasang SSL gratis:
```bash
sudo ln -s /etc/nginx/sites-available/teknowiz-billing /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d billing.teknowiz.id
```

---


---

## 🛡️ Arsitektur Keamanan Siber (Security & Hardening v1.12.0)

Sistem WizBilling telah melewati audit keamanan siber (*Black-box Penetration Testing*) dan diperkuat dengan lapisan pertahanan:
1. **Enforce HTTPS (301 Permanent Redirect)**: Seluruh akses plaintext dialihkan secara otomatis ke protokol terenkripsi HTTPS.
2. **Security Headers Lengkap**: Dilengkapi dengan `Strict-Transport-Security` (HSTS Preload), `X-Frame-Options` (Anti-Clickjacking), `X-Content-Type-Options` (nosniff), `Referrer-Policy`, dan `Permissions-Policy`.
3. **Penyembunyian Fingerprint**: Header `x-powered-by: Next.js` dinonaktifkan (`poweredByHeader: false`) untuk mencegah identifikasi teknologi oleh scanner eksternal.
4. **Multi-Tier Rate Limiting & Cloudflare Integration**: Proteksi serangan *Brute-Force* dan *Credential Stuffing* dengan 3 bucket rate-limiting berbasis `cf-connecting-ip` (per-Email, per-IP, dan per-Pair).
5. **Progressive Anti-Bot Math CAPTCHA**: Tantangan verifikasi matematika dinamis yang otomatis aktif saat terjadi kegagalan autentikasi beruntun (>= 2 kali).
6. **Anti Open-Redirect Sanitizer**: Validasi ketat parameter `?redirect=` untuk mencegah pengalihan pengguna ke URL berbahaya di luar domain.


---

## 🗺️ Roadmap & Skenario Pengembangan Lanjutan

Rencana arsitektur dan skenario implementasi kode fitur prioritas berikutnya (Modul Pajak PP 55, Integrasi WhatsApp Gateway, Berita Acara Serah Terima / BAST, Audit Trail RBAC, dan Bot Health Monitoring) telah disusun lengkap pada:
👉 **[`docs/SKENARIO-PENGEMBANGAN-TAHAP-LANJUTAN.md`](docs/SKENARIO-PENGEMBANGAN-TAHAP-LANJUTAN.md)**

*Disusun untuk operasional resmi PT Tekno Wiz Indonesia.*
