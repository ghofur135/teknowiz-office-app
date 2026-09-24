import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docNumber = searchParams.get('doc');

    if (!docNumber) {
      return NextResponse.json({ error: 'Parameter nomor dokumen (doc) diperlukan' }, { status: 400 });
    }

    const db = getDb();

    // 1. Cek apakah ini Kwitansi (KWT/...)
    if (docNumber.toUpperCase().startsWith('KWT')) {
      const paymentRes = await db.execute({
        sql: `SELECT p.*, d.document_number, d.issue_date, c.name as client_name, c.client_code
              FROM payments p
              JOIN documents d ON p.document_id = d.id
              JOIN clients c ON d.client_id = c.id
              WHERE UPPER(p.receipt_number) = UPPER(?)
              LIMIT 1`,
        args: [docNumber]
      });

      if (paymentRes.rows.length > 0) {
        const row = paymentRes.rows[0];
        return NextResponse.json({
          found: true,
          type: 'Kwitansi Pembayaran Resmi',
          type_code: 'RECEIPT',
          document_number: row.receipt_number,
          related_document: row.document_number,
          date: row.payment_date,
          client_name: row.client_name,
          client_code: row.client_code,
          amount: row.amount,
          payment_method: row.payment_method,
          reference_number: row.reference_number,
          signer: row.received_by || 'Finance PT Tekno Wiz Indonesia',
          status: 'LUNAS (SAH)',
          verified_at: new Date().toISOString()
        });
      }
    }

    // 2. Cek apakah ini Invoice atau Quotation di tabel documents
    const docRes = await db.execute({
      sql: `SELECT d.*, c.name as client_name, c.client_code
            FROM documents d
            JOIN clients c ON d.client_id = c.id
            WHERE UPPER(d.document_number) = UPPER(?)
            LIMIT 1`,
      args: [docNumber]
    });

    if (docRes.rows.length > 0) {
      const row = docRes.rows[0];
      const isInvoice = row.document_type === 'INVOICE';
      return NextResponse.json({
        found: true,
        type: isInvoice ? 'Faktur Tagihan (Invoice)' : 'Surat Penawaran Harga (Quotation)',
        type_code: row.document_type,
        document_number: row.document_number,
        date: row.issue_date,
        due_date: row.due_date,
        client_name: row.client_name,
        client_code: row.client_code,
        amount: row.grand_total,
        paid_amount: row.paid_amount,
        balance_due: row.balance_due,
        signer: row.signed_by || 'Dhimas Ghofur A. F.',
        signer_title: row.signer_title || 'Direktur Utama',
        status: String(row.status).toUpperCase(),
        verified_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      found: false,
      message: 'Nomor dokumen tidak ditemukan dalam arsip resmi PT Tekno Wiz Indonesia'
    }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
