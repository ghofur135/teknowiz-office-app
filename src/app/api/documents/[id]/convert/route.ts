import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateDocumentNumber } from '@/lib/number-generator';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();

    // 1. Dapatkan quotation asal
    const quoRes = await db.execute({
      sql: 'SELECT * FROM documents WHERE id = ? AND document_type = ?',
      args: [params.id, 'QUOTATION']
    });

    if (quoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Quotation tidak ditemukan' }, { status: 404 });
    }

    const quo = quoRes.rows[0];

    // 2. Ambil baris item
    const itemsRes = await db.execute({
      sql: 'SELECT * FROM document_items WHERE document_id = ? ORDER BY sort_order ASC, id ASC',
      args: [params.id]
    });

    // 3. Generate nomor invoice baru
    const today = new Date().toISOString().split('T')[0];
    const invoiceNumber = await generateDocumentNumber('INV', today);

    // Hitung default due date (misal 14 hari dari hari ini)
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 14);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // 4. Insert dokumen INVOICE baru
    const newDocRes = await db.execute({
      sql: `
        INSERT INTO documents (
          document_type, document_number, reference_number, client_id,
          issue_date, due_date, valid_until, payment_terms, status,
          subtotal, discount_type, discount_value, discount_amount,
          tax_rate, tax_amount, withholding_tax_rate, withholding_tax_amount,
          grand_total, paid_amount, balance_due,
          notes, payment_instructions, signed_by, signer_title
        ) VALUES (
          'INVOICE', ?, ?, ?,
          ?, ?, NULL, ?, 'DRAFT',
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, 0, ?,
          ?, ?, ?, ?
        ) RETURNING id
      `,
      args: [
        invoiceNumber,
        quo.document_number, // Referensi nomor penawaran asal
        quo.client_id,
        today,
        dueDate,
        quo.payment_terms || 'Full Payment',
        quo.subtotal,
        quo.discount_type,
        quo.discount_value,
        quo.discount_amount,
        quo.tax_rate,
        quo.tax_amount,
        quo.withholding_tax_rate,
        quo.withholding_tax_amount,
        quo.grand_total,
        quo.grand_total, // balance_due awal = grand_total
        quo.notes,
        quo.payment_instructions,
        quo.signed_by,
        quo.signer_title,
      ]
    });

    const newInvoiceId = newDocRes.rows[0].id;

    // 5. Salin seluruh item
    for (let i = 0; i < itemsRes.rows.length; i++) {
      const item = itemsRes.rows[i];
      await db.execute({
        sql: `
          INSERT INTO document_items (
            document_id, product_service_id, item_name, description,
            quantity, unit, unit_price, discount_amount, total_price, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          newInvoiceId,
          item.product_service_id,
          item.item_name,
          item.description,
          item.quantity,
          item.unit,
          item.unit_price,
          item.discount_amount,
          item.total_price,
          i
        ]
      });
    }

    return NextResponse.json({
      success: true,
      new_invoice_id: newInvoiceId,
      document_number: invoiceNumber,
      message: `Berhasil mengonversi ${quo.document_number} ke ${invoiceNumber}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
