const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

async function seedDummyNonPKP() {
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'billing.sqlite3');
  const client = createClient({ url: `file:${dbPath}` });

  console.log('🔄 Mempersiapkan transaksi dummy PT Perorangan Non-PKP...');

  // 1. Pastikan profil perusahaan berstatus Non-PKP dan memiliki Suket PP 55
  await client.execute({
    sql: `UPDATE company_profiles SET
      is_pkp = 0,
      tax_scheme = 'PP55_FINAL',
      suket_pp55_number = 'KET-01428/WPJ.10/KP.0403/2026',
      tax_footer_note = 'PT Tekno Wiz Indonesia merupakan entitas PT Perorangan Wajib Pajak Badan Non-PKP (Memanfaatkan tarif PPh Final 0,5% sesuai PP No. 55/2022 jo. PP No. 20/2026).'
    WHERE id = 1`
  });
  console.log('✅ Profil perusahaan diset: Non-PKP, PPh Final 0.5% PP 55/2022, Suket KET-01428/WPJ.10/KP.0403/2026');

  // 2. Tambahkan Master Klien Dummy B2B
  const clientB2BRes = await client.execute({
    sql: `INSERT INTO clients (client_code, name, pic_name, pic_phone, pic_email, address, client_type, tax_number, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(client_code) DO UPDATE SET name = excluded.name
          RETURNING id`,
    args: [
      'CLI-2026-004',
      'PT Sinergi Media Digital',
      'Bpk. Rahmat Hidayat, S.T.',
      '+62 812 8899 0011',
      'finance@sinergimedia.co.id',
      'Ruko Slawi Square No. 12, Jl. Jenderal Sudirman, Slawi, Tegal',
      'B2B',
      '02.456.789.1-501.000',
      'Kemitraan pengadaan Digital Signage PulseTV Control & Cloud Display'
    ]
  });
  const clientB2BId = clientB2BRes.rows[0].id;

  // Tambahkan Master Klien Dummy UMKM
  const clientUMKMRes = await client.execute({
    sql: `INSERT INTO clients (client_code, name, pic_name, pic_phone, pic_email, address, client_type, tax_number, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(client_code) DO UPDATE SET name = excluded.name
          RETURNING id`,
    args: [
      'CLI-2026-005',
      'Klinik & Apotek Sehat Medika',
      'dr. Maya Safitri',
      '+62 857 1234 5678',
      'admin@sehatmedika.id',
      'Jl. Ahmad Yani No. 45, Procot, Slawi, Kab. Tegal',
      'UMKM',
      '98.765.432.1-501.000',
      'Pengadaan SIM Klinik & Farmasi TeknoPharm bridging BPJS'
    ]
  });
  const clientUMKMId = clientUMKMRes.rows[0].id;

  const today = '2026-09-25';
  const dueDateB2B = '2026-10-09';
  const ym = '202609';

  // 3. Transaksi 1: B2B Non-PKP dengan Potongan PPh Final 0,5% (Suket PP 55)
  // Subtotal: Rp 24.000.000
  // PPN 0% (Non-PKP): Rp 0
  // Potongan PPh Final 0,5% (Suket PP 55): Rp 120.000
  // Grand Total: Rp 23.880.000
  // Terbayar (DP Termin 1): Rp 12.000.000
  // Sisa Tagihan (Balance Due): Rp 11.880.000
  // Status: PARTIAL
  const inv2Number = `INV/TW/${ym}/002`;
  await client.execute({
    sql: `DELETE FROM documents WHERE document_number = ?`,
    args: [inv2Number]
  });

  const inv2Res = await client.execute({
    sql: `INSERT INTO documents (
      document_type, document_number, reference_number, client_id,
      issue_date, due_date, valid_until, payment_terms, status,
      subtotal, discount_type, discount_value, discount_amount,
      tax_rate, tax_amount, withholding_tax_rate, withholding_tax_amount,
      grand_total, paid_amount, balance_due,
      notes, payment_instructions, signed_by, signer_title
    ) VALUES (
      'INVOICE', ?, 'PO-SMD/2026/09/01', ?,
      ?, ?, NULL, 'Termin 1 (DP 50%)', 'PARTIAL',
      24000000, 'FIXED', 0, 0,
      0, 0, 0.5, 120000,
      23880000, 12000000, 11880000,
      'Penagihan Termin 1 (DP 50%) pengadaan PulseTV Control. Dilampirkan salinan Surat Keterangan (Suket) PP 55 Nomor KET-01428/WPJ.10/KP.0403/2026 sebagai dasar pemotongan PPh Final 0,5%.',
      'Rekening Resmi:\nBank Mandiri KCP Slawi\nNo. Rekening: 138-00-2299881-1\nAtas Nama: PT TEKNO WIZ INDONESIA',
      'Dhimas Ghofur A. F.', 'Direktur Utama'
    ) RETURNING id`,
    args: [inv2Number, clientB2BId, today, dueDateB2B]
  });
  const inv2Id = inv2Res.rows[0].id;

  // Item rincian Transaksi 1
  await client.execute({
    sql: `INSERT INTO document_items (document_id, item_name, description, quantity, unit, unit_price, discount_amount, total_price, sort_order)
          VALUES 
          (?, 'PulseTV Control - Cloud Signage (Lisensi 4 Layar x 10 Bulan)', 'Manajemen konten digital signage terpusat multi-screen kantor pusat & cabang', 40, 'Layar/Bulan', 450000, 0, 18000000, 0),
          (?, 'Jasa Instalasi & Network Setup Cloud Signage', 'Konfigurasi perangkat pemutar, topologi jaringan lokal, dan pelatihan operator', 1, 'Paket', 6000000, 0, 6000000, 1)`,
    args: [inv2Id, inv2Id]
  });

  // Kwitansi Pembayaran Termin 1 Transaksi 1
  const kwt2Number = `KWT/TW/${ym}/002`;
  await client.execute({
    sql: `DELETE FROM payments WHERE receipt_number = ?`,
    args: [kwt2Number]
  });

  await client.execute({
    sql: `INSERT INTO payments (
      receipt_number, document_id, payment_date, amount, terbilang,
      payment_method, bank_destination, proof_reference, notes, received_by
    ) VALUES (
      ?, ?, ?, 12000000, 'Dua Belas Juta Rupiah',
      'BANK_TRANSFER', 'Bank Mandiri 138-00-2299881-1 a.n PT TEKNO WIZ INDONESIA',
      'TRX-MDR-20260925-883921', 'Pembayaran DP Termin 1 (50%) Pengadaan PulseTV Control',
      'Finance PT Tekno Wiz Indonesia'
    )`,
    args: [kwt2Number, inv2Id, today]
  });

  // 4. Transaksi 2: UMKM Non-PKP Murni LUNAS (Tanpa Potongan PPh, PPN 0%)
  // Subtotal: Rp 18.500.000
  // Diskon: Rp 1.500.000
  // DPP: Rp 17.000.000
  // PPN 0%: Rp 0
  // Potongan: 0%
  // Grand Total: Rp 17.000.000
  // Terbayar: Rp 17.000.000 (LUNAS / PAID)
  // Sisa: Rp 0
  const inv3Number = `INV/TW/${ym}/003`;
  await client.execute({
    sql: `DELETE FROM documents WHERE document_number = ?`,
    args: [inv3Number]
  });

  const inv3Res = await client.execute({
    sql: `INSERT INTO documents (
      document_type, document_number, reference_number, client_id,
      issue_date, due_date, valid_until, payment_terms, status,
      subtotal, discount_type, discount_value, discount_amount,
      tax_rate, tax_amount, withholding_tax_rate, withholding_tax_amount,
      grand_total, paid_amount, balance_due,
      notes, payment_instructions, signed_by, signer_title
    ) VALUES (
      'INVOICE', ?, 'KONTRAK-TP/2026/09', ?,
      ?, ?, NULL, 'Pelunasan Penuh (Full Payment)', 'PAID',
      18500000, 'FIXED', 1500000, 1500000,
      0, 0, 0, 0,
      17000000, 17000000, 0,
      'Penagihan lisensi sistem informasi klinik & apotek TeknoPharm 10 bulan penuh. PT Tekno Wiz Indonesia merupakan Wajib Pajak Badan Non-PKP.',
      'Rekening Resmi:\nBank Mandiri KCP Slawi\nNo. Rekening: 138-00-2299881-1\nAtas Nama: PT TEKNO WIZ INDONESIA',
      'Dhimas Ghofur A. F.', 'Direktur Utama'
    ) RETURNING id`,
    args: [inv3Number, clientUMKMId, today, today]
  });
  const inv3Id = inv3Res.rows[0].id;

  // Item rincian Transaksi 2
  await client.execute({
    sql: `INSERT INTO document_items (document_id, item_name, description, quantity, unit, unit_price, discount_amount, total_price, sort_order)
          VALUES 
          (?, 'TeknoPharm - Sistem Informasi Farmasi & Klinik', 'Langganan SIM Klinik & Apotek bridging BPJS / SatuSehat (Paket 10 Bulan)', 10, 'Bulan', 1850000, 1500000, 17000000, 0)`,
    args: [inv3Id]
  });

  // Kwitansi Pembayaran Transaksi 2
  const kwt3Number = `KWT/TW/${ym}/003`;
  await client.execute({
    sql: `DELETE FROM payments WHERE receipt_number = ?`,
    args: [kwt3Number]
  });

  await client.execute({
    sql: `INSERT INTO payments (
      receipt_number, document_id, payment_date, amount, terbilang,
      payment_method, bank_destination, proof_reference, notes, received_by
    ) VALUES (
      ?, ?, ?, 17000000, 'Tujuh Belas Juta Rupiah',
      'BANK_TRANSFER', 'Bank Mandiri 138-00-2299881-1 a.n PT TEKNO WIZ INDONESIA',
      'TRX-MDR-20260925-994102', 'Pelunasan Lisensi 10 Bulan SIM Klinik TeknoPharm',
      'Finance PT Tekno Wiz Indonesia'
    )`,
    args: [kwt3Number, inv3Id, today]
  });

  // 5. Update sekuens nomor dokumen
  await client.execute({
    sql: `INSERT INTO document_sequences (doc_type, year_month, last_sequence) VALUES ('INV', ?, 3)
          ON CONFLICT(doc_type, year_month) DO UPDATE SET last_sequence = MAX(last_sequence, 3)`,
    args: [ym]
  });
  await client.execute({
    sql: `INSERT INTO document_sequences (doc_type, year_month, last_sequence) VALUES ('KWT', ?, 3)
          ON CONFLICT(doc_type, year_month) DO UPDATE SET last_sequence = MAX(last_sequence, 3)`,
    args: [ym]
  });

  console.log('🎉 Transaksi dummy PT Perorangan Non-PKP berhasil dibuat:');
  console.log(`   1. [${inv2Number}] PT Sinergi Media Digital (B2B, PPN 0%, Potongan PPh Final 0.5% Suket PP 55, Status: PARTIAL, Kwitansi: ${kwt2Number})`);
  console.log(`   2. [${inv3Number}] Klinik & Apotek Sehat Medika (UMKM, PPN 0%, Potongan PPh 0%, Status: PAID, Kwitansi: ${kwt3Number})`);
}

seedDummyNonPKP().catch(err => {
  console.error('❌ Gagal membuat transaksi dummy:', err);
  process.exit(1);
});
