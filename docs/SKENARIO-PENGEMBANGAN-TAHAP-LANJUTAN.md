# Skenario & Rencana Pengembangan Lanjutan (WizBilling)
**PT Tekno Wiz Indonesia • Dokumen Arsitektur & Panduan Implementasi Teknis**

Dokumen ini memuat skenario implementasi kode, desain skema database, rute API, dan arsitektur antarmuka untuk fitur-fitur prioritas tahap berikutnya pada aplikasi **WizBilling (`teknowiz-office-app`)**.

---

## 📑 Daftar Modul Pengembangan

1. [Modul 1: Rekapitulasi & Kepatuhan Pajak PPh Final UMKM 0,5% (PP 55/2022)](#modul-1-rekapitulasi--kepatuhan-pajak-pph-final-umkm-05-pp-552022)
2. [Modul 2: Notifikasi & Penagihan Tagihan via WhatsApp Gateway (Wizly / GOWA)](#modul-2-notifikasi--penagihan-tagihan-via-whatsapp-gateway-wizly--gowa)
3. [Modul 3: Dokumen BAST (Berita Acara Serah Terima) & Watermark Dokumen](#modul-3-dokumen-bast-berita-acara-serah-terima--watermark-dokumen)
4. [Modul 4: Audit Trail Log & Role-Based Access Control (RBAC)](#modul-4-audit-trail-log--role-based-access-control-rbac)
5. [Modul 5: Health Check & Webhook Alerting Bot Telegram](#modul-5-health-check--webhook-alerting-bot-telegram)

---

## Modul 1: Rekapitulasi & Kepatuhan Pajak PPh Final UMKM 0,5% (PP 55/2022)

### 🎯 Tujuan
Memberikan kepatuhan perpajakan 100% otomatis bagi entitas PT Perorangan Non-PKP untuk menghitung omzet kotor bulanan, kalkulasi PPh Final 0,5% (KAP 411128 KJS 420), pencatatan Nomor Transaksi Penerimaan Negara (NTPN), serta rekapitulasi tahunan untuk lampiran SPT Tahunan Badan Form 1771.

### 🗄️ Skema Database (SQLite)
```sql
CREATE TABLE IF NOT EXISTS tax_settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_year_month TEXT UNIQUE NOT NULL, -- Format: YYYY-MM (e.g. 2026-09)
  gross_turnover REAL NOT NULL DEFAULT 0, -- Total omzet kotor bulan berjalan
  tax_rate REAL NOT NULL DEFAULT 0.005, -- 0.5%
  tax_amount REAL NOT NULL DEFAULT 0, -- Nilai pajak terutang
  kap_code TEXT NOT NULL DEFAULT '411128',
  kjs_code TEXT NOT NULL DEFAULT '420',
  billing_code TEXT, -- Kode Billing DJP Online
  ntpn_number TEXT, -- Nomor NTPN setelah setor
  bank_name TEXT, -- Bank persepsi
  payment_date DATE, -- Tanggal bayar (Maksimal tgl 15)
  status TEXT NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PAID', 'EXEMPT'
  proof_file_path TEXT, -- Bukti bayar (PDF/PNG)
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 🔌 API Endpoints
- `GET /api/tax/summary?year=2026`: Mengambil agregasi omzet bulanan dari tabel `documents` (Invoices berstatus selain CANCELLED) dan mencocokkannya dengan tabel `tax_settlements`.
- `POST /api/tax/settle`: Mencatat pelunasan pajak bulanan (Input Kode Billing, NTPN, dan unggah Bukti Penerimaan Negara / BPN).
- `GET /api/tax/export-1771?year=2026`: Ekspor tabel rekap peredaran bruto 12 bulan format Excel/PDF untuk lampiran SPT Badan 1771-IV.

### 💻 Struktur Frontend (`src/app/(dashboard)/tax/page.tsx`)
- **Kartu Ringkasan**: Kewajiban Pajak Bulan Ini, Status Penyetoran, Deadline Setor (Tgl 15 bulan berikutnya).
- **Panduan e-Billing Card**:
  - Wajib Pajak: PT TEKNO WIZ INDONESIA (NPWP: 31.849.201.8-501.000)
  - Jenis Pajak: PPh Final UMKM (KAP 411128 / KJS 420)
  - Tombol Satu-Klik: *"Salin Kode Billing"* & *"Tandai Sudah Disetor (NTPN)"*.
- **Tabel Rekapitulasi Tahunan (Januari - Desember)**.

---

## Modul 2: Notifikasi & Penagihan Tagihan via WhatsApp Gateway (Wizly / GOWA)

### 🎯 Tujuan
Mengirimkan dokumen penawaran harga (*Quotation*), faktur tagihan (*Invoice*), pengingat jatuh tempo (*Overdue Reminder*), dan kwitansi resmi (*Receipt*) langsung ke nomor WhatsApp PIC klien menggunakan infrastruktur WhatsApp API internal TeknoWiz (`teknowiz-dc04`).

### ⚙️ Konfigurasi Environment (`.env.local`)
```env
# Integrasi WhatsApp Gateway (dc04)
WA_GATEWAY_URL="https://wa.teknowiz.web.id"
WA_GATEWAY_API_KEY="[SECURE_API_KEY]"
WA_SENDER_NUMBER="6287811278630"
```

### 🔌 Backend Implementation (`src/lib/whatsapp.ts` & `src/app/api/documents/[id]/send-wa/route.ts`)
```typescript
export async function sendInvoiceWhatsApp(documentId: number, recipientPhone: string) {
  // 1. Ambil data dokumen & klien
  const doc = await getDocumentDetail(documentId);
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://billing.teknowiz.id'}/verify?code=${doc.document_number}`;

  // 2. Format template pesan formal enterprise
  const message = `Yth. *${doc.client_pic_name}*\n`
    + `*${doc.client_name}*\n\n`
    + `Berikut kami sampaikan tagihan resmi dari *PT Tekno Wiz Indonesia*:\n\n`
    + `📄 *No. Faktur:* ${doc.document_number}\n`
    + `📅 *Tanggal:* ${doc.issue_date}\n`
    + `⏳ *Jatuh Tempo:* ${doc.due_date || '-'}\n`
    + `💰 *Total Tagihan:* ${formatRupiah(doc.grand_total)}\n`
    + `💳 *Status:* ${doc.status}\n\n`
    + `Pembayaran dapat disalurkan melalui rekening resmi:\n`
    + `🏦 *Bank Mandiri:* 138-00-2299881-1\n`
    + `👤 *a.n:* PT TEKNO WIZ INDONESIA\n\n`
    + `🔗 *Lihat Dokumen Digital & Validasi QR:* \n${verifyUrl}\n\n`
    + `_Pesan ini dikirim otomatis oleh Sistem Finansial WizBilling PT Tekno Wiz Indonesia._`;

  // 3. Kirim via API Gateway GOWA
  return await fetch(`${process.env.WA_GATEWAY_URL}/api/send-message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WA_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: recipientPhone.replace(/^0/, '62').replace(/\D/g, ''),
      message: message
    })
  });
}
```

---

## Modul 3: Dokumen BAST (Berita Acara Serah Terima) & Watermark Dokumen

### 🎯 Tujuan
Menyediakan pencetakan berkas Berita Acara Serah Terima (BAST) untuk serah terima layanan software / implementasi sistem kepada instansi pemerintah (B2G) dan korporat (B2B), serta cap watermark dinamis (*DRAFT*, *PAID*, *VOID*) pada print preview A4.

### 🗄️ Penyesuaian Skema Dokumen
Memperluas field `documents` untuk metadata pekerjaan:
```sql
ALTER TABLE documents ADD COLUMN contract_number TEXT; -- Nomor SPK / Kontrak / PO Klien
ALTER TABLE documents ADD COLUMN work_period_start DATE; -- Periode awal layanan
ALTER TABLE documents ADD COLUMN work_period_end DATE; -- Periode akhir layanan
ALTER TABLE documents ADD COLUMN deliverable_summary TEXT; -- Uraian ringkas hasil serah terima
```

### 🖨️ Rute Print BAST (`src/app/print/bast/[id]/page.tsx`)
- Tata letak resmi berkop PT Tekno Wiz Indonesia.
- Komparasi PIHAK PERTAMA (Direktur Utama PT Tekno Wiz Indonesia) dan PIHAK KEDUA (Pejabat Pembuat Komitmen / PIC Klien).
- Tabel rincian pekerjaan dan klausul persetujuan serah terima hasil pekerjaan dalam keadaan baik dan berfungsi normal.
- Kolom tanda tangan basah dan meterai tempel / digital.

### 🎨 Watermark Dinamis CSS Print
```css
/* Tampil otomatis saat status PAID / CANCELLED */
.watermark-paid {
  position: absolute;
  top: 45%;
  left: 30%;
  transform: rotate(-30deg);
  font-size: 5rem;
  font-weight: 900;
  color: rgba(22, 163, 74, 0.12); /* Emerald transparan */
  border: 8px solid rgba(22, 163, 74, 0.18);
  padding: 10px 40px;
  border-radius: 16px;
  text-transform: uppercase;
  pointer-events: none;
}
```

---

## Modul 4: Audit Trail Log & Role-Based Access Control (RBAC)

### 🎯 Tujuan
Merekam jejak audit (*audit trail*) yang tidak dapat diubah atas setiap tindakan modifikasi data transaksi dan legalitas, serta pembagian peran akun.

### 🗄️ Skema Database
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'PRINT', 'LOGIN', 'EXPORT'
  entity_type TEXT NOT NULL, -- 'DOCUMENT', 'PAYMENT', 'CLIENT', 'COMPANY_PROFILE', 'LEGALITY'
  entity_id TEXT,
  description TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 👥 Hierarki Peran (Role RBAC)
1. **`SUPER_ADMIN`**: Akses penuh (termasuk rekening bank, profil legal PT, manajemen user, dan reset database).
2. **`FINANCE_STAFF`**: Akses pembuatan penawaran, faktur, kwitansi, penerimaan kas, dan pengiriman WhatsApp (Dilarang mengubah profil bank PT dan dokumen legalitas).
3. **`AUDITOR_VIEWER`**: Akses *Read-Only* untuk melihat laporan keuangan dan riwayat transaksi tanpa hak membuat atau mengedit data.

---

## Modul 5: Health Check & Webhook Alerting Bot Telegram

### 🎯 Tujuan
Memastikan ketersediaan sistem 24/7 di VPS `dc03` dan memantau kondisi integritas database SQLite via notifikasi Telegram jika terjadi kegagalan sistem.

### 🔌 Endpoint Monitoring (`src/app/api/health/route.ts`)
```typescript
export async function GET() {
  const start = Date.now();
  try {
    const db = getDb();
    const result = await db.execute('SELECT COUNT(*) as total FROM company_profiles');
    const latency = Date.now() - start;

    return NextResponse.json({
      status: 'HEALTHY',
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
      database: 'CONNECTED',
      dbLatencyMs: latency,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'UNHEALTHY',
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

---

## 📈 Rekomendasi Urutan Eksekusi Rilis (Roadmap)

| Tahap | Modul | Estimasi Target | Dampak Bisnis |
|---|---|:---:|---|
| **Fase 1** | **Modul 1: Kepatuhan Pajak PPh Final 0,5%** | v1.13.0 | Mencegah sanksi denda pajak & memudahkan SPT Tahunan |
| **Fase 2** | **Modul 2: Penagihan WhatsApp One-Click** | v1.14.0 | Mempercepat *cash inflow* & penerimaan pembayaran klien |
| **Fase 3** | **Modul 3: Template BAST & Watermark** | v1.15.0 | Standarisasi dokumen pengadaan B2G/B2B bernilai tinggi |
| **Fase 4** | **Modul 4 & 5: Audit Log, RBAC & Bot Monitoring** | v1.16.0 | Tata kelola enterprise & pengawasan sistem 24/7 |

---

*Disusun oleh Karina Amelia untuk PT Tekno Wiz Indonesia.*
