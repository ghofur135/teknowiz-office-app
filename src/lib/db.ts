import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

let dbClient: Client | null = null;

export function getDb(): Client {
  if (!dbClient) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'billing.sqlite3');
    const url = process.env.LIBSQL_URL || process.env.DATABASE_URL || `file:${dbPath}`;
    const authToken = process.env.LIBSQL_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

    dbClient = createClient({
      url,
      ...(authToken ? { authToken } : {}),
    });

    initSchema(dbClient);
  }
  return dbClient;
}

export async function initSchema(client: Client) {
  // Aktifkan foreign keys, WAL mode (PRD Section 4 & 5), dan busy_timeout
  await client.execute('PRAGMA foreign_keys = ON;');
  await client.execute('PRAGMA journal_mode = WAL;');
  await client.execute('PRAGMA busy_timeout = 5000;');

  // 1. Profil Perusahaan
  await client.execute(`
    CREATE TABLE IF NOT EXISTS company_profiles (
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
      qr_verification_mode TEXT DEFAULT 'offline',
      public_base_url TEXT DEFAULT 'https://billing.teknowiz.id',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await client.execute(`ALTER TABLE company_profiles ADD COLUMN qr_verification_mode TEXT DEFAULT 'offline';`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE company_profiles ADD COLUMN public_base_url TEXT DEFAULT 'https://billing.teknowiz.id';`);
  } catch {}

  // 2. Master Klien
  await client.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      pic_name TEXT,
      pic_phone TEXT NOT NULL,
      pic_email TEXT,
      address TEXT,
      client_type TEXT DEFAULT 'B2B',
      tax_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Master Katalog Produk & Layanan
  await client.execute(`
    CREATE TABLE IF NOT EXISTS product_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      default_price REAL NOT NULL DEFAULT 0,
      billing_unit TEXT DEFAULT 'Bulan',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Dokumen Induk (Quotation & Invoice)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_type TEXT NOT NULL,
      document_number TEXT UNIQUE NOT NULL,
      reference_number TEXT,
      client_id INTEGER NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE,
      valid_until DATE,
      payment_terms TEXT DEFAULT 'Full Payment',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      subtotal REAL NOT NULL DEFAULT 0,
      discount_type TEXT DEFAULT 'FIXED',
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      withholding_tax_rate REAL DEFAULT 0,
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
  `);

  // 5. Item Rincian Dokumen
  await client.execute(`
    CREATE TABLE IF NOT EXISTS document_items (
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
  `);

  // 6. Pembayaran & Kwitansi
  await client.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT UNIQUE NOT NULL,
      document_id INTEGER NOT NULL,
      payment_date DATE NOT NULL,
      amount REAL NOT NULL,
      terbilang TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      bank_destination TEXT,
      proof_reference TEXT,
      notes TEXT,
      received_by TEXT DEFAULT 'Finance PT Tekno Wiz Indonesia',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  // 7. Sekuens Dokumen Otomatis
  await client.execute(`
    CREATE TABLE IF NOT EXISTS document_sequences (
      doc_type TEXT NOT NULL,
      year_month TEXT NOT NULL,
      last_sequence INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (doc_type, year_month)
    );
  `);

  // 8. Tabel Pengguna / Admin Auth
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

  // 9. Dokumen Legalitas & Kepatuhan Perusahaan
  await client.execute(`
    CREATE TABLE IF NOT EXISTS company_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_category TEXT NOT NULL,
      title TEXT NOT NULL,
      document_number TEXT,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT NOT NULL DEFAULT 'application/pdf',
      issue_date TEXT,
      expiry_date TEXT,
      is_lifetime INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin user
  const userCheck = await client.execute('SELECT COUNT(*) as count FROM users');
  if (Number(userCheck.rows[0].count) === 0) {
    await client.execute({
      sql: `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      args: ['Dhimas Ghofur A. F.', 'dhimas@teknowiz.id', 'Teknowiz26#!', 'ADMIN']
    });
  }

  // Seed default data jika tabel company_profiles masih kosong
  const compCheck = await client.execute('SELECT COUNT(*) as count FROM company_profiles');
  const count = Number(compCheck.rows[0].count);

  if (count === 0) {
    await client.execute({
      sql: `INSERT INTO company_profiles (
        company_name, brand_name, slogan, address, city, postal_code, email, phone, website,
        npwp, nib, bank_name, bank_account_number, bank_account_holder, logo_path, stamp_signature_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'PT Tekno Wiz Indonesia',
        'TeknoWiz Indonesia',
        'Membangun Ekosistem Digital Berkelanjutan',
        'Slawi Kulon, Kec. Slawi',
        'Slawi, Kabupaten Tegal, Jawa Tengah',
        '52411',
        'halo@teknowiz.id',
        '+62 878 1127 8630',
        'https://teknowiz.id',
        '31.849.201.8-501.000',
        '0220109123456',
        'Bank Mandiri',
        '138-00-2299881-1',
        'PT TEKNO WIZ INDONESIA',
        '/images/logo.png',
        '/images/stamp-teknowiz.png'
      ]
    });

    // Seed default Produk SaaS & Jasa IT
    const products = [
      { code: 'TW-SAAS-01', name: 'PulseTV Control - Cloud Signage', category: 'SAAS', price: 450000, unit: 'Layar/Bulan', desc: 'Sistem manajemen konten digital signage terpusat multi-screen' },
      { code: 'TW-SAAS-02', name: 'Wizly - Smart Helpdesk & Ticketing', category: 'SAAS', price: 1250000, unit: 'Bulan', desc: 'Platform automasi tiket layanan TI dan customer support omnichannel' },
      { code: 'TW-SAAS-03', name: 'WizPortal - Enterprise Intranet & SSO', category: 'SAAS', price: 2500000, unit: 'Bulan', desc: 'Portal internal pegawai terintegrasi Single Sign-On dan arsip digital' },
      { code: 'TW-SAAS-04', name: 'InfraMate - Server & Network Monitoring', category: 'SAAS', price: 1750000, unit: 'Bulan', desc: 'Pemantauan uptime server, bandwidth mikrotik, dan alerting WhatsApp 24/7' },
      { code: 'TW-SAAS-05', name: 'DaganganGO - POS & Inventory Omnichannel', category: 'SAAS', price: 650000, unit: 'Outlet/Bulan', desc: 'Aplikasi kasir multi-cabang dengan sinkronisasi stok realtime' },
      { code: 'TW-SAAS-06', name: 'TeknoPharm - Sistem Informasi Farmasi & Klinik', category: 'SAAS', price: 1850000, unit: 'Bulan', desc: 'SIM Klinik & Apotek bridging BPJS / SatuSehat' },
      { code: 'TW-SRV-01', name: 'Jasa Konsultasi Arsitektur TI & Cloud', category: 'IT_SERVICE', price: 15000000, unit: 'Paket', desc: 'Audit infrastruktur, perancangan topologi high availability, dan security hardening' },
      { code: 'TW-SRV-02', name: 'Jasa Implementasi & Integrasi Sistem B2G/B2B', category: 'IT_SERVICE', price: 25000000, unit: 'Paket', desc: 'Kustomisasi API, migrasi data, dan pelatihan personil teknis' },
      { code: 'TW-SRV-03', name: 'Maintenance & Managed Service Tahunan', category: 'IT_SERVICE', price: 36000000, unit: 'Tahun', desc: 'Dukungan SLA 99.5%, patching berkala, backup off-site mingguan' }
    ];

    for (const p of products) {
      await client.execute({
        sql: `INSERT INTO product_services (code, name, category, description, default_price, billing_unit)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [p.code, p.name, p.category, p.desc, p.price, p.unit]
      });
    }

    // Seed default Demo Client
    await client.execute({
      sql: `INSERT INTO clients (client_code, name, pic_name, pic_phone, pic_email, address, client_type, tax_number, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'CLI-2026-001',
        'RSUD Dr. Soeselo Slawi',
        'Bpk. Hendra Gunawan, S.Kom',
        '+62 812 3456 7890',
        'it.rsudsoeselo@tegalkab.go.id',
        'Jl. Doel Satar No. 9, Slawi, Kab. Tegal',
        'B2G',
        '00.123.456.7-501.000',
        'Klien pengadaan PulseTV & SIM Antrean Digital'
      ]
    });
  }
}
