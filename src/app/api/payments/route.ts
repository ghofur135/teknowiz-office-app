export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateDocumentNumber } from '@/lib/number-generator';
import { terbilangRupiah } from '@/lib/terbilang';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('document_id');

    const db = getDb();
    let query = `
      SELECT 
        p.*,
        d.document_number,
        d.document_type,
        d.grand_total,
        c.name as client_name,
        c.client_code
      FROM payments p
      JOIN documents d ON p.document_id = d.id
      JOIN clients c ON d.client_id = c.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (documentId) {
      query += ' AND p.document_id = ?';
      args.push(documentId);
    }

    query += ' ORDER BY p.payment_date DESC, p.id DESC';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const documentId = Number(body.document_id);
    const payAmount = Number(body.amount);
    const paymentDate = body.payment_date || new Date().toISOString().split('T')[0];

    if (!documentId || !payAmount || payAmount <= 0) {
      return NextResponse.json({ error: 'Nominal pembayaran tidak valid' }, { status: 400 });
    }

    // 1. Ambil info invoice
    const docRes = await db.execute({
      sql: 'SELECT * FROM documents WHERE id = ?',
      args: [documentId]
    });

    if (docRes.rows.length === 0) {
      return NextResponse.json({ error: 'Dokumen tagihan tidak ditemukan' }, { status: 404 });
    }

    const doc = docRes.rows[0];
    const currentPaid = Number(doc.paid_amount) || 0;
    const grandTotal = Number(doc.grand_total) || 0;

    const newPaidAmount = currentPaid + payAmount;
    const newBalanceDue = Math.max(0, grandTotal - newPaidAmount);

    // Tentukan status baru: PAID atau PARTIAL
    let newStatus: string = 'PARTIAL';
    if (newBalanceDue === 0 && newPaidAmount >= grandTotal) {
      newStatus = 'PAID';
    }

    // 2. Generate Nomor Kwitansi Otomatis (KWT/TW/YYYYMM/000)
    const receiptNumber = await generateDocumentNumber('KWT', paymentDate);

    // 3. Generate teks terbilang otomatis
    const terbilangText = terbilangRupiah(payAmount);

    // 4. Insert ke tabel payments
    const payRes = await db.execute({
      sql: `
        INSERT INTO payments (
          receipt_number, document_id, payment_date, amount, terbilang,
          payment_method, bank_destination, proof_reference, notes, received_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
      `,
      args: [
        receiptNumber,
        documentId,
        paymentDate,
        payAmount,
        terbilangText,
        body.payment_method || 'BANK_TRANSFER',
        body.bank_destination || 'Bank Mandiri (138-00-2299881-1)',
        body.proof_reference || null,
        body.notes || null,
        body.received_by || 'Finance PT Tekno Wiz Indonesia'
      ]
    });

    const paymentId = payRes.rows[0].id;

    // 5. Update invoice paid_amount, balance_due, dan status
    await db.execute({
      sql: `
        UPDATE documents SET
          paid_amount = ?,
          balance_due = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [newPaidAmount, newBalanceDue, newStatus, documentId]
    });

    return NextResponse.json({
      success: true,
      id: paymentId,
      receipt_number: receiptNumber,
      terbilang: terbilangText,
      paid_amount: newPaidAmount,
      balance_due: newBalanceDue,
      invoice_status: newStatus
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
