# Product Requirement Document (PRD) v1.0
# TeknoWiz Invoice & Billing Management System (WizBilling)

---

## 1. Executive Summary & Visi Produk

**WizBilling** adalah sistem aplikasi manajemen faktur, penawaran harga (*quotation*), pencatatan transaksi, dan kwitansi pembayaran mandiri (*standalone micro-app*) yang dirancang khusus untuk memenuhi standar legalitas, akuntabilitas, dan operasional bisnis **PT Tekno Wiz Indonesia**.

Dengan peresmian badan hukum PT, sistem ini berfungsi sebagai pusat kontrol keuangan dan penerbitan dokumen resmi perusahaan ke klien instansi (B2B/B2G), korporasi, maupun UMKM, mencakup layanan penjualan lisensi produk SaaS (PulseTV Control, Wizly, WizPortal, InfraMate, DaganganGO, TeknoPharm) serta layanan jasa Solusi & Konsultasi IT.

---

## 2. Identitas Perusahaan & Standar Dokumen Legal

Semua dokumen yang diterbitkan oleh sistem wajib mematuhi standar identitas resmi perusahaan:

- **Nama Entitas Legal**: **PT Tekno Wiz Indonesia**
- **Slogan Resmi**: *Membangun Ekosistem Digital Berkelanjutan*
- **Bidang Usaha**: Solusi & Konsultasi IT, Integrasi Sistem, dan Penyedia Platform Digital
- **Domisili Resmi**: Slawi, Kabupaten Tegal, Jawa Tengah, Indonesia
- **Kontak Resmi**:
  - Email: `halo@teknowiz.id`
  - WhatsApp: `+62 878 1127 8630`
  - Website: `https://teknowiz.id`
- **Palet Warna Dokumen Resmi**:
  - Primary Dark: `#0F172A` (Slate 900 / Deep Navy)
  - Accent Brand: `#0284C7` / `#0EA5E9` (Sky Blue / Tech Cyan)
  - Neutral Base: `#FFFFFF` & `#F8FAFC` (Pure White & Slate 50)
  - Border & Dividers: `#E2E8F0` (Slate 200)
  - Text Primary: `#1E293B` (Slate 800)
  - Text Muted: `#64748B` (Slate 500)
- **Aturan Desain UI & Dokumen**:
  - Tampilan bersih, tegas, dan berwibawa (*Corporate Clean*).
  - **DILARANG** menggunakan efek *glassmorphism* (`backdrop-blur`), *gradient blobs*, neon glow, atau animasi berlebihan.
  - Cetakan dokumen wajib presisi 1 lembar A4 (*pixel-perfect print stylesheet*).

---

## 3. Ruang Lingkup Dokumen Transaksi

Sistem wajib mendukung 4 jenis dokumen utama yang saling terintegrasi dalam satu siklus transaksi:

1. **Surat Penawaran Harga / Quotation (`QUO/TW/YYYYMM/000`)**
   - Diterbitkan sebelum proyek/layanan disepakati.
   - Memuat rincian paket layanan, opsi masa berlaku penawaran, termin pembayaran, dan estimasi waktu pengerjaan.
   - Dapat di-convert menjadi Invoice dengan 1 klik.
2. **Faktur Tagihan / Invoice (`INV/TW/YYYYMM/000`)**
   - Tagihan resmi yang memuat rincian barang/jasa, potongan harga, termin (DP, Progress, Pelunasan, atau Langganan Bulanan/Tahunan), tanggal jatuh tempo (*Due Date*), nomor rekening perusahaan, dan QR Code verifikasi.
3. **Kwitansi Pembayaran / Official Receipt (`KWT/TW/YYYYMM/000`)**
   - Diterbitkan otomatis ketika invoice berstatus **PAID** atau saat pembayaran bertahap diterima.
   - Memuat teks "Telah diterima dari", "Uang sejumlah (Terbilang otomatis)", peruntukan pembayaran, tanda tangan/stempel digital, dan opsi materai digital.
4. **Berita Acara Serah Terima / BAST (`BAST/TW/YYYYMM/000`)** *(Opsional Tambahan)*
   - Dokumen serah terima pekerjaan/lisensi produk sebelum pelunasan final.

---

## 4. Arsitektur Sistem & Technology Stack

Sistem dibangun sebagai aplikasi mandiri (*lightweight & high performance*):

- **Backend / Engine**: Python (FastAPI) ATAU Node.js (Express / Next.js standalone)
- **Database**: **SQLite 3** dengan mode WAL (*Write-Ahead Logging*) untuk performa konkurensi optimal dan zero-configuration setup.
- **Frontend / UI**: HTML5 + Tailwind CSS v4 + Alpine.js / React (Light mode, clean enterprise style).
- **PDF Engine**: 
  - Direct Browser High-Res Print CSS (`@media print` A4 margin 0.5in), dan/atau
  - Headless Chromium (Playwright / Puppeteer / WeasyPrint) untuk ekspor direct file PDF.
- **Library Terbilang**: Parser otomatis angka rupiah ke teks bahasa Indonesia (contoh: `Rp 15.750.000` ➡️ *"Lima Belas Juta Tujuh Ratus Lima Puluh Ribu Rupiah"*).

---

## 5. Skema Database (SQLite DDL Specification)

```sql
-- 1. Pengaturan Perusahaan & Rekening (Single Row / Multi-Config)
CREATE TABLE company_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL DEFAULT 'PT Tekno Wiz Indonesia',
    brand_name TEXT NOT NULL DEFAULT 'TeknoWiz Indonesia',
    slogan TEXT DEFAULT 'Membangun Ekosistem Digital Berkelanjutan',
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Slawi, Kabupaten Tegal, Jawa Tengah',
    postal_code TEXT DEFAULT '52411',
    email TEXT DEFAULT 'halo@teknowiz.id',
    phone TEXT DEFAULT '+62 878 1127 8630',
    website TEXT DEFAULT 'https://teknowiz.id',
    npwp TEXT,
    nib TEXT,
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    bank_account_holder TEXT NOT NULL,
    logo_path TEXT,
    stamp_signature_path TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Data Klien / CRM Mini
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_code TEXT UNIQUE NOT NULL,      -- Contoh: CLI-2026-001
    name TEXT NOT NULL,                    -- Nama Instansi / Perusahaan / Klien
    pic_name TEXT,                         -- Nama PIC / Pejabat Pembuat Komitmen
    pic_phone TEXT NOT NULL,               -- Nomor WhatsApp PIC
    pic_email TEXT,
    address TEXT,
    client_type TEXT DEFAULT 'B2B',        -- B2B, B2G (Pemerintah/RS), B2C, UMKM
    tax_number TEXT,                       -- NPWP Klien (Opsional)
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Master Katalog Produk & Layanan TeknoWiz
CREATE TABLE product_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,             -- TW-PROD-01
    name TEXT NOT NULL,                    -- PulseTV Control / Wizly / Jasa Maintenance
    category TEXT NOT NULL,                -- SAAS, IT_SERVICE, HARDWARE, LICENSE
    description TEXT,
    default_price REAL NOT NULL DEFAULT 0,
    billing_unit TEXT DEFAULT 'Bulan',     -- Bulan, Tahun, Unit, Paket, Titik, Lisensi
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Transaksi / Dokumen Induk (Quotation & Invoice)
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type TEXT NOT NULL,           -- 'QUOTATION' | 'INVOICE'
    document_number TEXT UNIQUE NOT NULL,   -- QUO/TW/202609/001 atau INV/TW/202609/001
    reference_number TEXT,                 -- Hubungan PO atau No Penawaran asal
    client_id INTEGER NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    valid_until DATE,                      -- Khusus Quotation
    payment_terms TEXT DEFAULT 'Full Payment', -- 'DP 50%', 'Termin 1', 'Monthly'
    status TEXT NOT NULL DEFAULT 'DRAFT',  -- 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'
    
    -- Kalkulasi Keuangan
    subtotal REAL NOT NULL DEFAULT 0,
    discount_type TEXT DEFAULT 'FIXED',    -- 'PERCENT' | 'FIXED'
    discount_value REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,               -- Contoh: 11 atau 12 (PPN)
    tax_amount REAL DEFAULT 0,
    withholding_tax_rate REAL DEFAULT 0,   -- Contoh: 2 (PPh 23)
    withholding_tax_amount REAL DEFAULT 0,
    grand_total REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    balance_due REAL DEFAULT 0,
    
    notes TEXT,
    payment_instructions TEXT,
    signed_by TEXT DEFAULT 'Dhimas Ghofur A. F.',
    signer_title TEXT DEFAULT 'Direktur Utama',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);

-- 5. Tabel Item Rincian Dokumen
CREATE TABLE document_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    product_service_id INTEGER,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'Paket',
    unit_price REAL NOT NULL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (product_service_id) REFERENCES product_services(id) ON DELETE SET NULL
);

-- 6. Tabel Pembayaran & Penerbitan Kwitansi
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_number TEXT UNIQUE NOT NULL,    -- KWT/TW/202609/001
    document_id INTEGER NOT NULL,          -- Terhubung ke Invoice
    payment_date DATE NOT NULL,
    amount REAL NOT NULL,
    terbilang TEXT NOT NULL,               -- Rangkaian teks bahasa Indonesia
    payment_method TEXT NOT NULL,          -- 'BANK_TRANSFER', 'QRIS', 'TUNAI'
    bank_destination TEXT,
    proof_reference TEXT,                  -- No Referensi Bank / File Bukti Transfer
    notes TEXT,
    received_by TEXT DEFAULT 'Finance PT Tekno Wiz Indonesia',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 7. Penomoran Dokumen Otomatis
CREATE TABLE document_sequences (
    doc_type TEXT NOT NULL,                -- 'QUO', 'INV', 'KWT'
    year_month TEXT NOT NULL,              -- '202609'
    last_sequence INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (doc_type, year_month)
);
```

---

## 6. Logika Bisnis & Spesifikasi Alur Kerja

### A. Generator Nomor Otomatis Berurutan
Format standar penomoran: `[KODE]/TW/[YYYYMM]/[NOMOR_URUT_3_DIGIT]`
- Contoh Penawaran: `QUO/TW/202609/001`
- Contoh Tagihan: `INV/TW/202609/001`
- Contoh Kwitansi: `KWT/TW/202609/001`

Sistem mengunci (*atomic transaction*) tabel `document_sequences` saat nomor baru di-generate per bulan berjalan untuk mencegah nomor ganda/lompat.

### B. Rumus Kalkulasi Keuangan
1. `Subtotal` = $\sum (\text{Quantity} \times \text{Unit Price} - \text{Item Discount})$
2. `Discount Amount` = Jika percent: $(\text{Subtotal} \times \text{Discount Value}) / 100$, jika fixed: $\text{Discount Value}$
3. `Taxable Amount` = $\text{Subtotal} - \text{Discount Amount}$
4. `PPN Amount` = $(\text{Taxable Amount} \times \text{Tax Rate}) / 100$
5. `PPh 23 Amount` = $(\text{Taxable Amount} \times \text{Withholding Tax Rate}) / 100$
6. `Grand Total` = $\text{Taxable Amount} + \text{PPN Amount} - \text{PPh 23 Amount}$
7. `Balance Due` = $\text{Grand Total} - \text{Paid Amount}$

### C. Konversi Otomatis Quotation ➡️ Invoice
- Tombol *"Terbitkan Invoice dari Penawaran Ini"* membuat salinan dokumen baru bertipe `INVOICE`, mengalokasikan nomor `INV/TW/...` baru, menyalin seluruh baris item, dan menandai referensi penawaran asal.

### D. Siklus Pembayaran & Kwitansi
- Ketika pembayaran diinput (misal DP Rp 10.000.000):
  - Sistem otomatis menghitung sisa tagihan (*Balance Due*).
  - Jika `Balance Due == 0` ➡️ Status Invoice berubah menjadi `PAID`.
  - Jika `Balance Due > 0` ➡️ Status Invoice menjadi `PARTIAL`.
  - Sistem langsung meng-generate Kwitansi Pembayaran (`KWT/TW/...`) dengan fungsi *terbilang* otomatis dan tombol langsung cetak.

---

## 7. Desain Tata Letak Cetak A4 (Print-Ready Layout)

### Header Dokumen:
- **Kiri Atas**: Logo Resmi PT Tekno Wiz Indonesia (Badge TW Navy & Petir Cyan) + Teks Nama PT + Slogan.
- **Kanan Atas**: Judul Dokumen Huruf Kapital Tebal (**INVOICE / FAKTUR TAGIHAN**, **SURAT PENAWARAN HARGA**, atau **KWITANSI PEMBAYARAN**) + Nomor Dokumen + Status Badge (LUNAS / JATUH TEMPO).

### Informasi Pihak & Detail:
- **Diterbitkan Oleh**: PT Tekno Wiz Indonesia, Slawi, Tegal, Email & WA resmi.
- **Ditujukan Kepada**: Nama Instansi/Klien, Nama PIC, Alamat, No Telepon.
- **Metadata Transaksi**: Tanggal Terbit, Tanggal Jatuh Tempo, Metode Pembayaran, Proyek/Perihal.

### Tabel Item Rincian:
- Header Tabel: `No`, `Deskripsi Barang / Layanan`, `Qty`, `Satuan`, `Harga Satuan (Rp)`, `Diskon (Rp)`, `Total (Rp)`.
- Body: Baris item yang rapi dengan font monospaced angka agar titik desimal sejajar.

### Footer & Pengesahan:
- **Kiri Bawah**:
  - Petunjuk Transfer Bank (Nama Bank, No Rekening, Atas Nama PT Tekno Wiz Indonesia).
  - Catatan Tambahan / Syarat & Ketentuan.
  - QR Code verifikasi keaslian dokumen.
- **Kanan Bawah**:
  - Tabel Rekapitulasi (Subtotal, Diskon, PPN, PPh 23, Grand Total, Terbayar, Sisa Tagihan).
  - Kolom Tanda Tangan & Stempel Resmi Perusahaan (Dhimas Ghofur A. F. - Direktur Utama).

---

## 8. Spesifikasi Antarmuka Pengguna (UI/UX Modules)

Aplikasi memiliki 5 modul utama dengan navigasi samping (*Sidebar Clean*):

1. **Dashboard Overview**:
   - Ringkasan Finansial: Total Omzet Bulan Ini, Tagihan Tertunda (*Unpaid/Overdue*), Total Diterima (*Cash Inflow*).
   - Pintasan Cepat: Buat Penawaran Baru, Buat Invoice Baru, Catat Pembayaran.
   - Tabel 5 Transaksi Terbaru & Alert Jatuh Tempo.
2. **Manajemen Invoice**:
   - Filter Tab: *Semua, Draft, Menunggu Pembayaran, Terbayar Sebagian, Lunas, Jatuh Tempo*.
   - Aksi Cepat: Preview Cetak A4, Download PDF, Catat Pembayaran, Kirim Tautan WhatsApp, Edit, Batalkan.
3. **Manajemen Penawaran (Quotation)**:
   - Status: *Draft, Terkirim, Diterima/Disetujui, Ditolak, Dikonversi ke Invoice*.
   - Aksi: Edit, Cetak Penawaran, Convert to Invoice.
4. **Buku Kwitansi & Transaksi (Receipts)**:
   - Arsip seluruh tanda terima pembayaran sah.
   - Fitur Cetak Kwitansi Resmi bermaterai / tanda tangan.
5. **Master Klien & Katalog Layanan**:
   - CRUD data klien (B2B/B2G/UMKM).
   - CRUD katalog paket SaaS (PulseTV, Wizly, dll) dan standar tarif jasa konsultasi.
6. **Pengaturan Perusahaan (Settings)**:
   - Edit profil PT, NIB, NPWP, Nomor Rekening Bank, dan Upload Logo/Stempel.

---

## 9. Struktur Folder Proyek yang Direkomendasikan

```
teknowiz-billing/
├── assets/                  # Logo, stempel, font korporat
├── data/
│   └── billing.sqlite3      # Database SQLite lokal
├── src/
│   ├── database/            # Inisialisasi skema & migrasi SQLite
│   ├── services/
│   │   ├── number_generator.py  # Logika nomor urut QUO/INV/KWT
│   │   ├── terbilang.py         # Parser angka ke teks rupiah
│   │   └── pdf_service.py       # Renderer PDF A4
│   ├── routes/              # Endpoint API / Page controller
│   └── templates/           # HTML / React print layouts
├── public/
│   └── css/print.css        # CSS @media print A4 pixel-perfect
├── README.md
└── package.json / requirements.txt
```

---

## 10. Prompt Instruksi Eksekusi Antigravity

Dokumen PRD ini dapat langsung dieksekusi di Antigravity / AI Engine dengan instruksi:
> *"Implementasikan full-stack micro-app TeknoWiz Billing & Invoicing System sesuai spesifikasi PRD-TEKNOWIZ-BILLING-INVOICE.md. Gunakan database SQLite dengan skema DDL yang tersedia, bangun UI bersih korporat (tanpa glassmorphism/gradient blobs), implementasikan layout cetak A4 pixel-perfect untuk Quotation, Invoice, dan Kwitansi, serta terapkan generator nomor otomatis dan fungsi terbilang bahasa Indonesia."*

---
*Dokumen ini disusun resmi untuk PT Tekno Wiz Indonesia — September 2026.*
