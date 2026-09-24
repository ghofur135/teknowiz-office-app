const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

async function seed() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'billing.sqlite3');
  const client = createClient({ url: `file:${dbPath}` });

  console.log('🔄 Menyiapkan database SQLite WizBilling...');
  await client.execute('PRAGMA foreign_keys = ON;');
  await client.execute('PRAGMA journal_mode = WAL;');
  await client.execute('PRAGMA busy_timeout = 5000;');

  // Pastikan tabel users ada
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'ADMIN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCheck = await client.execute('SELECT COUNT(*) as count FROM users WHERE email = ?', ['dhimas@teknowiz.id']);
  if (Number(userCheck.rows[0].count) === 0) {
    console.log('📌 Menyimpan Akun Admin Resmi (dhimas@teknowiz.id)...');
    await client.execute({
      sql: `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      args: ['Dhimas Ghofur A. F.', 'dhimas@teknowiz.id', 'Teknowiz26#!', 'ADMIN']
    });
  }

  // Pastikan Klien 2 dan 3 ada
  const existingClients = await client.execute('SELECT client_code FROM clients');
  const codes = existingClients.rows.map(r => r.client_code);

  if (!codes.includes('CLI-2026-002')) {
    await client.execute({
      sql: `INSERT INTO clients (client_code, name, pic_name, pic_phone, pic_email, address, client_type, tax_number, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'CLI-2026-002',
        'Dinas Komunikasi & Informatika Kab. Tegal',
        'Ibu Siti Rahmawati, M.T.',
        '+62 813 9876 5432',
        'kominfo@tegalkab.go.id',
        'Komplek Kantor Pemda Kab. Tegal',
        'B2G',
        '00.987.654.3-501.000',
        'Pengadaan Platform Enterprise WizPortal SSO'
      ]
    });
  }

  if (!codes.includes('CLI-2026-003')) {
    await client.execute({
      sql: `INSERT INTO clients (client_code, name, pic_name, pic_phone, pic_email, address, client_type, tax_number, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'CLI-2026-003',
        'PT Sumber Makmur Sentosa',
        'Bpk. Aris Wibowo',
        '+62 818 2233 4455',
        'procurement@sumbermakmur.co.id',
        'Kawasan Industri Pantura, Tegal',
        'B2B',
        '01.234.567.8-501.000',
        'Langganan DaganganGO & Maintenance Server'
      ]
    });
  }

  const allClients = await client.execute('SELECT id, name FROM clients ORDER BY id ASC');
  const client1Id = allClients.rows[0].id;
  const client2Id = allClients.rows.length > 1 ? allClients.rows[1].id : client1Id;

  // Cek Quotation
  const quoCount = await client.execute("SELECT COUNT(*) as count FROM documents WHERE document_type = 'QUOTATION'");
  if (Number(quoCount.rows[0].count) === 0) {
    console.log('📌 Menyimpan Surat Penawaran Demo...');
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const quoNumber = `QUO/TW/${ym}/001`;
    await client.execute({
      sql: `INSERT INTO document_sequences (doc_type, year_month, last_sequence) VALUES ('QUO', ?, 1)
            ON CONFLICT(doc_type, year_month) DO UPDATE SET last_sequence = 1`,
      args: [ym]
    });

    const quoRes = await client.execute({
      sql: `
        INSERT INTO documents (
          document_type, document_number, reference_number, client_id,
          issue_date, due_date, valid_until, payment_terms, status,
          subtotal, discount_type, discount_value, discount_amount,
          tax_rate, tax_amount, withholding_tax_rate, withholding_tax_amount,
          grand_total, paid_amount, balance_due,
          notes, payment_instructions, signed_by, signer_title
        ) VALUES (
          'QUOTATION', ?, 'SPN-KOMINFO/2026/08', ?,
          ?, NULL, ?, 'Termin 30 Hari (Net 30)', 'SENT',
          30000000, 'PERCENT', 5, 1500000,
          11, 3135000, 0, 0,
          31635000, 0, 31635000,
          'Penawaran implementasi platform WizPortal SSO untuk integrasi akun ASN Kabupaten Tegal.',
          'Rekening PT Tekno Wiz Indonesia - Bank Mandiri 138-00-2299881-1',
          'Dhimas Ghofur A. F.', 'Direktur Utama'
        ) RETURNING id
      `,
      args: [quoNumber, client2Id, today, validUntil]
    });
    const quoId = quoRes.rows[0].id;

    await client.execute({
      sql: `INSERT INTO document_items (document_id, item_name, description, quantity, unit, unit_price, discount_amount, total_price, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [quoId, 'WizPortal - Enterprise Intranet & SSO (Tahunan)', 'Lisensi cloud portal pegawai dengan kapasitas 500 pengguna', 1, 'Tahun', 30000000, 1500000, 28500000, 0]
    });
  }

  console.log('✅ Inisialisasi database dan seed data WizBilling berhasil!');
}

seed().catch((err) => {
  console.error('❌ Error saat menjalankan seed:', err);
  process.exit(1);
});
