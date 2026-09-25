# Changelog

Semua perubahan dan riwayat rilis sistem **WizBilling (TeknoWiz Invoice & Billing Management System)** dicatat secara lengkap dalam dokumen ini.

Format pencatatan mengikuti standar [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini mematuhi [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0] - 2026-09-25

### 🛡️ Security Audit Remediation & Hardening (Temuan Audit Keamanan Siber)
- **Penegakan Protokol HTTPS Otomatis (`src/middleware.ts`)**:
  - Menambahkan pengalihan permanen (HTTP 301 *Moved Permanently*) dari trafik `http://` ke `https://` pada middleware untuk memitigasi risiko serangan *Man-In-The-Middle* (MITM) saat diakses dari jaringan publik.
- **Implementasi Security Response Headers Komprehensif (`next.config.js`)**:
  - `Strict-Transport-Security` (HSTS): `max-age=63072000; includeSubDomains; preload` (memaksa browser hanya berkomunikasi via enkripsi HTTPS).
  - `X-Frame-Options`: `SAMEORIGIN` (mencegah eksploitasi serangan *Clickjacking* dan *UI redressing*).
  - `X-Content-Type-Options`: `nosniff` (mencegah *MIME-sniffing* browser pada berkas statis).
  - `Referrer-Policy`: `strict-origin-when-cross-origin` (melindungi privasi query string URL).
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()` (membatasi hak akses fitur perangkat yang tidak diperlukan).
  - `X-DNS-Prefetch-Control`: `on`.
- **Penyembunyian Fingerprint Framework (`next.config.js`)**:
  - Mengaktifkan `poweredByHeader: false` untuk menghapus header `x-powered-by: Next.js` dari seluruh respon HTTP guna mempersulit pemetaan teknologi oleh pihak luar (*information disclosure mitigation*).
- **Ekstraksi Client IP Aman & Multi-Tier Rate Limiting (`src/app/api/auth/login/route.ts`)**:
  - Mengintegrasikan header resmi Cloudflare `cf-connecting-ip` sebagai identitas IP klien terpercaya, kebal terhadap pemalsuan header `x-forwarded-for`.
  - Menerapkan arsitektur 3-Tier Rate Limiting:
    - Bucket 1: `login:email:{email}` (Maksimal 5x gagal dalam 15 menit per-email).
    - Bucket 2: `login:ip:{ip}` (Maksimal 10x gagal dalam 15 menit per-IP).
    - Bucket 3: `login:pair:{ip}:{email}` (Maksimal 5x gagal dalam 15 menit per-kombinasi).
- **Progressive Anti-Bot Math CAPTCHA (`src/app/login/page.tsx`)**:
  - Implementasi tantangan verifikasi matematika dinamis yang otomatis aktif ketika terjadi kegagalan login >= 2 kali berturut-turut untuk menghambat laju *automated dictionary/brute-force tools*.
- **Sanitasi Parameter Redirect (Anti Open-Redirect Vulnerability) (`src/app/login/page.tsx`)**:
  - Validasi ketat parameter URL `?redirect=` agar hanya menerima *relative path* internal (`/`) dan menolak manipulasi URL eksternal berbahaya (`//`, `\`).
- **Realtime API Metric Consistency (`src/app/api/**/route.ts`)**:
  - Menginjeksi `export const dynamic = 'force-dynamic'` dan `export const revalidate = 0` pada seluruh 17 endpoint API agar pembacaan metrik dan status tagihan selalu *fresh* dari database SQLite tanpa tertahan cache statis Next.js build.

## [1.11.0] - 2026-09-25

### 🔒 Keamanan Siber & Autentikasi: Proteksi Berlapis Form Login (Brute-Force & Injection Hardening)
- **Rate Limiting & Anti-Brute Force Tingkat Lanjut (`src/lib/rate-limiter.ts`, `/api/auth/login`)**:
  - Implementasi *In-Memory Sliding-Window Rate Limiter* untuk memitigasi serangan *Brute-Force*, *Credential Stuffing*, dan *Dictionary Attacks*.
  - Kebijakan proteksi ganda:
    - **Per-Akun/IP**: Maksimal 5 kali kegagalan login dalam kurun 15 menit. Jika terlampaui, akun/koneksi dikunci sementara selama 15 menit (HTTP 429 *Too Many Requests* disertai header `Retry-After`).
    - **Global Per-IP**: Maksimal 15 kali percobaan gagal dari satu IP dalam 15 menit, memicu pemblokiran IP selama 30 menit untuk meredam serangan terdistribusi.
    - Notifikasi sisa percobaan otomatis muncul pada formulir login saat percobaan gagal menyisakan $\le 3$ kali kesempatan.
    - Reset counter instan begitu pengguna berhasil memasukkan kredensial yang valid.
- **Peningkatan Algoritma Hashing: Salted Scrypt Key Derivation Function (KDF) (`src/lib/auth.ts`)**:
  - Menggantikan *single-iteration* SHA-256 legacy dengan algoritma **Scrypt** berstandar rekomendasi OWASP, dilengkapi *random salt* 16-byte kriptografis per-pengguna (`scrypt:<salt>:<hash>`).
  - Fitur **Silent Auto-Upgrade**: Pengguna lama atau seed default yang masih menggunakan format legacy (SHA-256 / plaintext) akan secara otomatis dan transparan di-rehash ke salted Scrypt saat pertama kali berhasil login tanpa mengganggu proses autentikasi.
- **Proteksi Terhadap Timing Attack & Username Enumeration (`auth.ts`)**:
  - Implementasi komputasi dummy Scrypt saat email pengguna tidak terdaftar di sistem. Hal ini menyamakan waktu respon server (*latency equalized*) sehingga penyerang tidak dapat menebak keberadaan email terdaftar melalui perbedaan durasi respon (mencegah *User Enumeration*).
  - Pengecekan password dan token signature menggunakan komparasi waktu-konstan (`crypto.timingSafeEqual`) untuk menangkal serangan *timing side-channel*.
- **Verifikasi Kriptografis Sesi pada Middleware Edge (`src/middleware.ts`)**:
  - Peningkatan validasi token cookie `wiz_session` di middleware Next.js menggunakan **Web Crypto API (`crypto.subtle`)** yang kompatibel penuh dengan Edge runtime.
  - Memverifikasi HMAC-SHA256 signature secara matematis dan validitas waktu kedaluwarsa (`exp`). Token palsu atau hasil manipulasi (*token tampering*) langsung ditolak sebelum dapat menyentuh rute dashboard atau private API.
  - Pengamanan rute privat `/api/*`: Akses API internal otomatis ditolak dengan status HTTP 401 jika cookie sesi tidak sah.
- **Pertahanan Terhadap Injection & Eksploitasi Payload**:
  - **SQL Injection**: Seluruh query autentikasi dan mutasi data database menggunakan *Parameterized Queries* (`@libsql/client` driver) sehingga input pengguna diperlakukan murni sebagai parameter data, bukan kode SQL executable.
  - **Prototype / Object Injection**: Sanitasi ketat memeriksa tipe data primitif `string` sebelum pemrosesan.
  - **DoS / Buffer Overflow**: Pembatasan panjang input email ($\le 100$ karakter) dan password ($\le 128$ karakter) untuk mencegah serangan *Regular Expression Denial of Service* (ReDoS) dan *memory exhaustion*.

### 🏷️ Sinkronisasi Versi Otomatis (Single Source of Truth)
- **Sentralisasi Versi Sistem (`package.json`, `src/lib/version.ts`, `next.config.js`)**:
  - Memperbarui versi pada `package.json` menjadi `1.11.0` agar selaras secara presisi dengan riwayat rilis `CHANGELOG.md`.
  - Membuat modul sentral [`src/lib/version.ts`](file:///d:/my-project/teknowiz-office-app/src/lib/version.ts) yang mengimpor nomor versi secara langsung dari `package.json` (`APP_VERSION`).
  - Mengonfigurasi `next.config.js` untuk mengekspos environment variable `NEXT_PUBLIC_APP_VERSION`.
  - Menggantikan string versi hardcoded pada footer bawah Sidebar ([`Sidebar.tsx`](file:///d:/my-project/teknowiz-office-app/src/components/Sidebar.tsx)) dan halaman login ([`login/page.tsx`](file:///d:/my-project/teknowiz-office-app/src/app/login/page.tsx)) dengan variabel dinamis `{APP_VERSION}` sehingga setiap kali ada rilis versi baru di masa mendatang, seluruh tampilan antarmuka (Web UI) akan otomatis tersinkronisasi tanpa perlu diedit manual.

---

## [1.10.0] - 2026-09-25

### 📱 Desain & Tata Letak: Full Mobile Responsiveness (Tampilan HP & Tablet)
- **Sistem Navigasi Mobile Drawer & Hamburger Menu (`SidebarContext`, `Sidebar.tsx`, `Navbar.tsx`)**:
  - Implementasi *Off-Canvas Navigation Drawer* untuk layar smartphone/tablet (`< 768px`). Sidebar tidak lagi menekan lebar halaman, melainkan tersembunyi secara default dan dapat dibuka via tombol Hamburger di pojok kiri atas Navbar.
  - Ditambahkan *Backdrop Overlay* gelap (`bg-slate-950/70 backdrop-blur-xs`) dengan transisi halus saat drawer terbuka.
  - Otomatis menutup drawer saat pengguna memilih menu atau saat rute URL berpindah (`pathname change`), serta saat menekan tombol `X`, klik di luar area drawer, atau menekan tombol `Esc`.
  - Body scroll locking (`overflow: hidden`) saat drawer aktif untuk mencegah scroll ganda pada layar sentuh.
- **Navbar Adaptif & Tombol Aksi Cepat**:
  - Tombol aksi *"Buat Faktur"* dan *"Buat Penawaran"* otomatis menyesuaikan ukuran pada layar kecil (`Faktur` / `Penawaran` di mobile, teks penuh di desktop).
  - Judul halaman dan subjudul tertata rapi tanpa menyebabkan pemotongan atau *wrapping* tata letak yang berantakan.
- **Tabel Dokumen & Detail yang Nyaman di Layar HP (`overflow-x-auto`)**:
  - Seluruh tabel rincian transaksi (`/invoices`, `/quotations`, `/receipts`, serta detail item `/invoices/[id]` dan `/quotations/[id]`) dilengkapi pembungkus *horizontal scroll* (`overflow-x-auto`).
  - Menetapkan batas lebar minimum (`min-w-[640px]` s.d. `min-w-[760px]`) sehingga kolom rincian barang/layanan, harga satuan, dan diskon tidak terjepit saat dilihat dari HP.
- **Formulir Transaksi & Ringkasan Finansial Responsif (`DocumentForm.tsx`)**:
  - Penyesuaian padding formulir (`p-4 sm:p-6 md:p-8`) dan tombol simpan *full-width* pada layar ponsel.
  - Grid kalkulasi finansial (Diskon Tambahan, PPN, Potongan Pajak Lawan) otomatis berpindah ke format vertikal pada layar sempit sehingga angka dan pilihan tarif tidak bertumpuk.
- **Modal Dialog Sentuh-Ramah (*Touch-Friendly*)**:
  - Modal tambah/edit klien (`/clients`), modal katalog produk (`/products`), dan modal pencatatan pembayaran (`PaymentModal.tsx`) diperbarui dengan grid fleksibel (`grid-cols-1 sm:grid-cols-2`), batas tinggi maksimal (`max-h-[92vh]`), dan area formulir yang dapat digulir (*scrollable*).
- **Pratinjau Dokumen Cetak di Ponsel (`/print/...`)**:
  - Kertas cetak A4 dan A5 Landscape dibungkus dalam kontainer *responsive swipeable viewer* sehingga pengguna smartphone dapat menginspeksi lembar faktur atau kwitansi secara leluasa tanpa merusak lebar halaman web.

---

## [1.9.0] - 2026-09-25

### 📄 Fitur Baru: Dukungan Format Cetak A5 Landscape & A4 Portrait
- **Standar Baru Kwitansi Pembayaran (`/print/receipt/[id]`)**:
  - Format default kwitansi kini menggunakan **A5 Landscape ($210\text{ mm} \times 148\text{ mm}$)** yang merupakan standar resmi buku kwitansi korporat di Indonesia.
  - Layout proporsional dan padat dengan border formal ganda, kotak nominal terbilang, stempel basah, QR code verifikasi, serta kolom tanda tangan dan meterai tempel tanpa menyisakan ruang kosong vertikal berlebih.
  - Injeksi otomatis CSS `@page { size: A5 landscape; }` sehingga dialog cetak browser (Ctrl + P) langsung memilih kertas A5 Landscape secara presisi.
- **Toggle Pemilihan Ukuran Kertas pada Dokumen Cetak (`Invoice`, `Quotation`, `Receipt`)**:
  - Tombol beralih fleksibel antara:
    - **📑 A5 Landscape**: Format ringkas setengah kertas A4 horisontal (hemat 50% kertas, cocok untuk tagihan 1-4 item dan kwitansi).
    - **📄 A4 Portrait**: Format selembar penuh vertikal standar korporat (cocok untuk tagihan dengan banyak rincian item).
  - Tampilan layar dan layout tabel menyesuaikan secara realtime sesuai ukuran kertas yang dipilih.

---

## [1.8.0] - 2026-09-25

### ⚖️ Kepatuhan Pajak & Ketentuan Transaksi PT Perorangan (UU Cipta Kerja, PP 55/2022 & PP 20/2026)
- **Modul Kepatuhan Pajak & Status Pengukuhan PKP (`/settings`)**:
  - Konfigurasi status Pengusaha Kena Pajak (PKP) perorangan:
    - **Non-PKP (Default UMKM)**: Sesuai PMK 197/PMK.03/2013 (omzet < Rp 4,8 Miliar), faktur tagihan **tidak memungut PPN (0%)** dan bebas kewajiban lapor SPT Masa PPN bulanan demi menjaga kepatuhan dari risiko penerbitan faktur pajak ilegal (Pasal 39A UU KUP).
    - **Sudah PKP (Pengukuhan Sukarela / Omzet > Rp 4,8 M)**: Mengaktifkan pemungutan PPN resmi (11% atau 12%) yang disinkronkan dengan penerbitan Faktur Pajak e-Faktur / Coretax DJP.
  - Skema PPh Badan PT Perorangan:
    - Dukungan **PPh Final UMKM 0,5%** (PP 55/2022 jo. PP 20/2026) yang kini dapat dimanfaatkan **tanpa batasan waktu** bagi entitas PT Perorangan yang didirikan 1 orang.
    - Opsi tarif umum Badan Pasal 31E UU PPh (diskon 50% = tarif efektif 11% dari Penghasilan Kena Pajak / Laba Bersih Fiskal).
  - Manajemen **Nomor Surat Keterangan (Suket) PP 55 / PP 23**:
    - Input nomor Suket resmi DJP yang otomatis dicantumkan di footer faktur tagihan agar rekanan pemotong B2B/B2G hanya memotong PPh Final 0,5% (bukan PPh 23 sebesar 2%).
  - Kotak edukasi ringkas ketentuan transaksi PT Perorangan (pemisahan harta pribadi vs PT, kewajiban rekening bank korporat, dan ketentuan bahwa PT Perorangan adalah Wajib Pajak Badan sehingga fasilitas omzet Rp 500 juta bebas pajak milik Orang Pribadi tidak berlaku).
- **Pembaruan Formulir Transaksi Dokumen (`DocumentForm.tsx`)**:
  - Deteksi otomatis status PKP perusahaan saat membuka pembuatan faktur tagihan (`/invoices/new`) atau penawaran (`/quotations/new`).
  - Opsi dropdown tarif PPN dengan panduan kontekstual (`0% Non-PKP`, `11% PPN Standar PKP`, `12% PPN 12% PKP`).
  - Preset pemotongan pajak rekanan (*Withholding Tax*):
    - `0%`: Klien ritel/UMKM tanpa pemotongan.
    - `0,5%`: Rekanan B2B/B2G memotong PPh Final 0,5% dengan Bukti Potong atas dasar Suket PP 55.
    - `2%`: Rekanan memotong PPh 23 standar jasa TI.
  - Tombol aksi cepat *"Sisipkan Klausul Pajak PT"* pada kolom catatan/instruksi pembayaran dokumen.
- **Pembaruan Template Cetak Presisi A4 (`/print/invoice/[id]` & `/print/quotation/[id]`)**:
  - Penambahan badge status legalitas pada kop surat dokumen: `PT Perorangan • Non-PKP` / `PKP`.
  - Rekapitulasi finansial menampilkan kejelasan status PPN (`PPN (0% Non-PKP): Rp 0` atau persentase tarif bila PKP).
  - Rincian pemotongan PPh yang transparan (`Potongan PPh (0.5% Suket PP 55)` atau `Potongan PPh (2% PPh 23)`).
  - Kotak *Kepatuhan Pajak PT Perorangan* pada footer cetak faktur tagihan yang memuat klausul dasar hukum PP 55/2022 jo. PP 20/2026 dan nomor Suket resmi.
- **Dinamika Tarif Katalog Produk (`/products`)**:
  - Modal pratinjau produk kini secara cerdas menampilkan *"Tarif Tagihan Non-PKP"* (harga bersih tanpa pungutan PPN) jika perusahaan berstatus Non-PKP, atau menampilkan estimasi PPN 11% jika telah berstatus PKP.
- **Pembaruan Skema Database & PRD**:
  - Penambahan kolom `is_pkp`, `tax_scheme`, `suket_pp55_number`, dan `tax_footer_note` pada tabel `company_profiles` SQLite.
  - Pembaruan dokumen spesifikasi `PRD-TEKNOWIZ-BILLING-INVOICE.md` Bagian 2 dan Bagian 6.B.

---

## [1.7.0] - 2026-09-24

### 🚀 Fitur Baru: Script Auto-Restore & Sinkronisasi VPS (`npm run restore:vps`)
- **Interactive SSH/SFTP Migration CLI (`scripts/restore-vps.js`)**:
  - Otomatisasi migrasi penuh dari lokal ke VPS server tanpa perlu upload berkas ulang manual di antarmuka web.
  - Input interaktif dengan validasi:
    - **IP VPS / Host**: Wajib diisi.
    - **Port SSH**: Fleksibel (default `22`).
    - **User VPS**: Fleksibel (default `root`).
    - **Password VPS**: Wajib dengan proteksi *masked input* (`*`).
    - **Direktori Remote**: Default `/var/www/teknowiz-office-app`.
  - **Auto WAL-Checkpoint**: Menjalankan `PRAGMA wal_checkpoint(TRUNCATE)` otomatis pada SQLite lokal sebelum upload agar data transaksi teranyar 100% konsisten.
  - **SFTP Stream Pipeline**: Mengunggah file database `billing.sqlite3` dan seluruh berkas PDF legalitas perusahaan (`public/uploads/legality/*.pdf`) dengan indikator progres ukuran.
  - **Linux Best Practices**: Menjalankan `mkdir -p`, pengaturan permission (`chmod 755` & `chmod 644`), dan deteksi auto-reload PM2.
- **Local Backup Bundler (`scripts/backup.js` / `npm run backup`)**:
  - Menyediakan pembuatan arsip snapshot `.tar.gz` lokal yang menggabungkan database dan berkas legalitas.

---

## [1.6.0] - 2026-09-24

### 👥 Fitur Baru: Modal Pratinjau Profil Klien & Mini-CRM (`/clients`)
- **Fitur Pratinjau Lengkap (Client Preview Modal)**:
  - Tombol aksi baru **"Lihat Pratinjau Lengkap"** (ikon mata `Eye`) pada setiap kartu klien, serta nama instansi klien kini dapat diklik untuk membuka lembar profil lengkap.
  - Tampilan modal interaktif memuat:
    - **Identitas & Kemitraan**: Kode unik klien (`CLI-2026-...`), nama lengkap instansi, dan badge klasifikasi (*B2G Pemerintah/RSUD, B2B Korporat Swasta, UMKM*).
    - **Kotak Kontak PIC & Komunikasi Langsung**: Nama penanggung jawab teknis/pejabat pengadaan, email dinas/kantor, serta **tombol integrasi langsung Chat WhatsApp** (`https://wa.me/...`).
    - **Legalitas & Perpajakan**: NPWP instansi klien dan catatan histori pengadaan/kebutuhan proyek.
    - **Alamat Lengkap**: Alamat penagihan dan domisili kantor klien secara utuh (*no truncation*).
    - **Salin Kontak (Copy to Clipboard)**: Salin seluruh profil kontak instansi klien ke *clipboard* dalam satu klik.
    - **Pintasan Transaksi Sekali Klik**: Tombol langsung untuk *"Edit Data"*, *"Buat Penawaran"* (`/quotations/new`), dan *"Buat Faktur"* (`/invoices/new`).

---

## [1.5.0] - 2026-09-24

### 📦 Fitur Baru: Modal Pratinjau Produk & Spesifikasi Layanan (`/products`)
- **Fitur Pratinjau Lengkap (Product Preview Modal)**:
  - Tombol aksi baru **"Lihat Pratinjau"** (ikon mata `Eye`) pada setiap kartu produk, serta judul produk kini dapat diklik untuk membuka modal rincian.
  - Tampilan modal interaktif memuat:
    - **Header & Kategori**: Identitas resmi, kode produk (`TW-SAAS-...`, dsb.), dan badge kategori.
    - **Highlight Tarif Komersial**: Kotak tarif standar gelap yang elegan dengan kalkulasi otomatis estimasi harga termasuk PPN 11%.
    - **Deskripsi & Ruang Lingkup Layanan**: Rincian teknis lengkap tanpa batasan baris (*no truncation*).
    - **Standar Mutu & SLA**: Komitmen layanan dan dasar kontrak PT Tekno Wiz Indonesia.
    - **Salin Spesifikasi (Copy to Clipboard)**: Salin format teks rapi untuk dikirimkan langsung ke klien via WhatsApp atau proposal email.
    - **Pintasan Aksi**: Tombol langsung untuk *"Edit Data"* dan *"Buat Penawaran"* (`/quotations/new`).

---

## [1.4.0] - 2026-09-24

### 📑 Fitur Baru: Arsip Dokumen Legalitas Perusahaan (`/legality`)
- **Modul Arsip Legalitas PT (`/legality`)**:
  - Halaman khusus untuk mengunggah, mengarsipkan, melihat pratinjau (*preview* langsung di browser), dan mengunduh berkas fisik resmi PT Tekno Wiz Indonesia.
  - Kategori Dokumen Resmi:
    - Akta Pendirian & Perubahan PT (Notaris)
    - SK Kemenkumham RI (Pengesahan Badan Hukum)
    - NIB (Nomor Induk Berusaha OSS RBA)
    - NPWP Badan & SKT Pajak
    - SPPKP (Surat Pengukuhan Pengusaha Kena Pajak)
    - KTP & NPWP Direktur Utama / Penanggung Jawab
    - Buku Tabungan / Rekening Koran Giro Perusahaan
    - Sertifikasi PSE Kominfo, ISO, & Lisensi Produk
    - Dokumen Legalitas & Perizinan Lainnya
- **Indikator Kepatuhan Tender & Vendor (Compliance Tracker)**:
  - Widget visual pelacak kelengkapan 6 dokumen pokok perusahaan yang sering diminta dinas B2G (RSUD, Pemda) & B2B dengan persentase kelengkapan otomatis.
- **Penyimpanan Berkas Fisik & Keamanan**:
  - Backend API (`POST /api/legality` & `DELETE /api/legality/[id]`) dengan penyimpanan file fisik di `public/uploads/legality/` (maksimal 25MB per file, format PDF, PNG, JPG).
  - Skema database baru `company_documents` di SQLite untuk metadata dokumen, nomor registrasi, tanggal terbit, masa berlaku (*lifetime* atau tanggal kedaluwarsa), dan catatan.
- **Navigasi Terintegrasi**:
  - Menu baru **"Legalitas PT"** di Sidebar dengan ikon `ShieldCheck`.
  - Banner pintas langsung di menu **Pengaturan PT (`/settings`)**.

---

## [1.3.0] - 2026-09-24

### 🔍 Fitur Baru: Dual-Mode QR Code Verifikasi Dokumen (Offline & Online)
- **Dua Mode Verifikasi Keabsahan Dokumen (Dapat Diatur di `/settings`)**:
  - **📱 Mode Offline (Default)**: Barcode/QR Code menyimpan struktur teks keabsahan resmi (Nomor Dokumen, Tanggal, Nama Klien, Nominal, Penandatangan, dan Status Terdaftar). Dapat langsung discan kamera smartphone / Google Lens **tanpa membutuhkan koneksi internet**.
  - **🌐 Mode Online**: Barcode/QR Code mengarahkan pemindai ke tautan portal verifikasi web publik resmi (`/verify?doc=...`). Dilengkapi pengaturan kustomisasi Domain / Base URL publik (misal: `https://billing.teknowiz.id`).
- **Portal Verifikasi Publik (`/verify`)**:
  - Halaman publik tanpa autentikasi (di-bypass oleh middleware) untuk menampilkan rincian keabsahan faktur, penawaran, dan kwitansi secara elegan dan aman.
  - Dilengkapi tanda stempel resmi PT Tekno Wiz Indonesia dan status verifikasi realtime.
- **API Endpoint Verifikasi Publik (`/api/verify?doc=...`)**:
  - Mencari dokumen kwitansi, faktur, dan penawaran secara atomic di database SQLite.
- **Generator QR Dinamis (`DocumentQrCode.tsx`)**:
  - Integrasi library `qrcode` beresolusi tinggi dengan koreksi kesalahan level Medium (M).
- **Pengaturan & Live Interactive Preview (`/settings`)**:
  - Kartu konfigurasi baru untuk beralih mode secara 1-klik, input domain publik, dan live preview QR Code yang dapat langsung dites menggunakan kamera HP.

---

## [1.2.0] - 2026-09-24

### 🎨 Integrasi Aset Visual Korporat & Stempel Basah Resmi
- **Stempel Resmi PT Tekno Wiz Indonesia (`public/images/stamp-teknowiz.png`)**:
  - Format resolusi tinggi (1268 x 1240 RGBA) dengan stempel lingkaran resmi PT Tekno Wiz Indonesia.
  - Komponen `OfficialStamp` dengan efek natural *wet ink* (`mix-blend-multiply`, rotasi -4 derajat, drop-shadow halus).
  - Terintegrasi otomatis pada seluruh template cetak A4:
    - Cetak Faktur Tagihan (`/print/invoice/[id]`)
    - Cetak Surat Penawaran Harga (`/print/quotation/[id]`)
    - Cetak Kwitansi Resmi Pembayaran (`/print/receipt/[id]`)
  - Ditampilkan pada kartu pratinjau aset di menu **Pengaturan PT** (`/settings`).
- **Logo Resmi PT (`public/images/logo.png`)**:
  - Diterapkan pada kop surat dokumen cetak, login page sisi kanan, sidebar menu, dan navbar dashboard.
- **Favicon Resmi Aplikasi (`public/images/favicon.png`)**:
  - Diterapkan pada `src/app/layout.tsx` (konfigurasi metadata `icons` untuk shortcut icon, favicon, dan apple-touch-icon).
  - Sinkronisasi ke `src/app/icon.png` dan `public/favicon.ico` untuk kompatibilitas penuh semua web browser dan crawler.
- **Banner Login Korporat (`public/images/login-banner.png`)**:
  - Diterapkan pada sisi kiri halaman login mode *side-by-side*.

---

## [1.1.0] - 2026-09-24

### 🔐 Fitur Baru: Sistem Otentikasi & Halaman Login
- **Halaman Login Korporat (`/login`)**: Desain resmi *Corporate Clean* dengan badge PT Tekno Wiz Indonesia, toggle sembunyikan/tampilkan kata sandi, tombol pintas autofill kredensial, dan pesan kesalahan interaktif.
- **Kredensial Default Resmi**:
  - Email: `dhimas@teknowiz.id`
  - Password: `Teknowiz26#!`
  - Nama: Dhimas Ghofur A. F. (Direktur Utama / Admin)
- **Middleware Proteksi Rute (`src/middleware.ts`)**: Mengamankan seluruh halaman dashboard dan cetak dokumen dari akses tanpa sesi login. Otomatis mengarahkan ke `/login?redirect=...`.
- **API Otentikasi**:
  - `POST /api/auth/login`: Validasi kredensial dan penerbitan cookie HTTP-only `wiz_session` bertanda tangan HMAC.
  - `POST /api/auth/logout`: Penghapusan sesi dan logout aman.
  - `GET /api/auth/me`: Pengecekan profil pengguna aktif.
- **Pembaruan Sidebar**: Menampilkan nama akun aktif (`Dhimas Ghofur A. F.`) dan tombol Logout cepat.
- **Tabel Pengguna (`users`)**: Skema tabel akun di database SQLite dengan hashing kata sandi SHA-256 + secret salt.

---

## [1.0.0] - 2026-09-24

### 🎉 Rilis Perdana (Initial Release)

Implementasi penuh fullstack sistem manajemen faktur tagihan (*invoice*), surat penawaran (*quotation*), dan kwitansi pembayaran resmi (*receipt*) untuk **PT Tekno Wiz Indonesia** sesuai spesifikasi `PRD-TEKNOWIZ-BILLING-INVOICE.md`.

### ✨ Fitur Baru yang Ditambahkan:

#### 1. Arsitektur & Database
- **Framework Next.js 14 Fullstack (App Router)** dengan **TypeScript** dan **Tailwind CSS**.
- **Database SQLite 3 (`@libsql/client`)** yang berjalan dalam mode **WAL (*Write-Ahead Logging*)** dengan `busy_timeout` untuk akses konkurensi data yang cepat, stabil, dan aman dari *race condition*.
- Skema 7 tabel database relasional:
  - `company_profiles`: Profil legal PT, nomor rekening bank resmi, logo & tanda tangan.
  - `clients`: Mini-CRM master data instansi B2B, B2G, dan UMKM.
  - `product_services`: Katalog produk SaaS (*PulseTV, Wizly, WizPortal, InfraMate, DaganganGO, TeknoPharm*) dan paket jasa TI.
  - `documents`: Dokumen transaksi induk (Quotation & Invoice) dengan field finansial lengkap.
  - `document_items`: Baris rincian item, kuantitas, harga, diskon, dan total.
  - `payments`: Riwayat pembayaran bertahap/pelunasan dan penerbitan kwitansi sah.
  - `document_sequences`: Atomic lock sequence penomoran dokumen per bulan berjalan.
- Script inisialisasi database dan seed data demo lengkap (`scripts/seed.js` / `npm run seed`).

#### 2. Logika Bisnis & Kalkulator Keuangan
- **Generator Nomor Urut Dokumen Otomatis**: Penomoran sekuensial per bulan (`[KODE]/TW/[YYYYMM]/[XXX]`) dengan penguncian tabel sequence untuk mencegah nomor ganda/lompat:
  - Penawaran: `QUO/TW/YYYYMM/000`
  - Tagihan: `INV/TW/YYYYMM/000`
  - Kwitansi: `KWT/TW/YYYYMM/000`
- **Modul Terbilang Bahasa Indonesia**: Parser otomatis nominal angka rupiah ke dalam teks ejaan resmi bahasa Indonesia (`src/lib/terbilang.ts`), contoh: `Rp 15.000.000` ➡️ *"Lima Belas Juta Rupiah"*.
- **Kalkulator Finansial Realtime**: Perhitungan otomatis Subtotal, Diskon Item, Diskon Global (Persen / Nominal), Dasar Pengenaan Pajak (DPP), PPN (11% / 12%), Potongan PPh 23 (2%), Grand Total, dan Sisa Tagihan (*Balance Due*).
- **Konversi 1-Klik Quotation ➡️ Invoice**: Tombol *"Convert to Invoice"* yang otomatis membuat faktur `INV/TW/...` baru dari penawaran, menyalin seluruh baris item, dan mereferensikan nomor penawaran asal.
- **Siklus Pembayaran & Kwitansi Otomatis**: Pencatatan pembayaran langsung memperbarui sisa tagihan, mengalihkan status faktur secara otomatis (*PARTIAL* / *PAID*), dan menerbitkan nomor kwitansi resmi beserta tombol langsung cetak.

#### 3. Desain UI & Tata Letak Cetak A4 (*Corporate Clean*)
- Menerapkan standar visual korporat resmi PT Tekno Wiz Indonesia (Slate 900 `#0F172A`, Sky Blue `#0284C7`), **tanpa glassmorphism, tanpa neon glow, dan tanpa animasi berlebihan**.
- **Template Cetak Presisi 1 Lembar A4 (`@media print`)**:
  - Halaman Cetak Faktur Tagihan (`/print/invoice/[id]`)
  - Halaman Cetak Surat Penawaran Harga (`/print/quotation/[id]`) dengan blok persetujuan klien.
  - Halaman Cetak Kwitansi Resmi Pembayaran (`/print/receipt/[id]`) dengan bingkai ganda formal, teks terbilang, dan kotak meterai tempel $\ge$ Rp 5.000.000.
- Komponen badge resmi perusahaan (`CompanyBadge.tsx`) dan QR Code verifikasi dokumen (`DocumentQrCode.tsx`).

#### 4. Modul Aplikasi Lengkap
- **Dashboard Overview**: KPI omzet bulanan, piutang tertunda, kas masuk, alert jatuh tempo, dan riwayat transaksi terbaru.
- **Manajemen Faktur (Invoices)**: Filter tab status (*Draft, Sent, Partial, Paid, Overdue, Cancelled*), pencarian, modal catat bayar, dan fitur kirim pengingat via WhatsApp.
- **Manajemen Penawaran (Quotations)**: Drafting penawaran, penentuan masa berlaku, dan konversi ke invoice.
- **Buku Kwitansi (Receipts)**: Arsip seluruh pembayaran masuk dengan nominal dan teks terbilang.
- **Master Klien (Mini-CRM)**: CRUD data instansi B2B, B2G (Pemda/RSUD), dan UMKM.
- **Katalog Produk SaaS & Layanan IT**: CRUD paket langganan SaaS dan jasa konsultasi/implementasi TI.
- **Pengaturan PT**: Konfigurasi identitas legal (NIB, NPWP, domisili) dan rekening bank resmi penampung tagihan (Bank Mandiri).
- **Dokumentasi Lengkap**: File `README.md`, `redme.md`, dan `CHANGELOG.md`.
