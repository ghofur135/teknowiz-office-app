export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateDocumentFinancials } from '@/lib/calculator';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    
    // Ambil dokumen beserta relasi klien
    const docRes = await db.execute({
      sql: `
        SELECT 
          d.*,
          c.name as client_name,
          c.client_code,
          c.client_type,
          c.pic_name,
          c.pic_phone,
          c.pic_email,
          c.address as client_address,
          c.tax_number as client_tax_number
        FROM documents d
        JOIN clients c ON d.client_id = c.id
        WHERE d.id = ?
      `,
      args: [params.id]
    });

    if (docRes.rows.length === 0) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    const document = docRes.rows[0];

    // Ambil items
    const itemsRes = await db.execute({
      sql: `SELECT * FROM document_items WHERE document_id = ? ORDER BY sort_order ASC, id ASC`,
      args: [params.id]
    });

    // Ambil riwayat pembayaran
    const paymentsRes = await db.execute({
      sql: `SELECT * FROM payments WHERE document_id = ? ORDER BY payment_date DESC, id DESC`,
      args: [params.id]
    });

    // Ambil company profile
    const compRes = await db.execute('SELECT * FROM company_profiles LIMIT 1');

    return NextResponse.json({
      ...document,
      items: itemsRes.rows,
      payments: paymentsRes.rows,
      company: compRes.rows[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await request.json();

    // Check existing paid amount
    const existing = await db.execute({
      sql: 'SELECT paid_amount, status FROM documents WHERE id = ?',
      args: [params.id]
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    const currentPaid = Number(existing.rows[0].paid_amount) || 0;

    // Calculate updated financials
    const calc = calculateDocumentFinancials({
      items: body.items || [],
      discount_type: body.discount_type || 'FIXED',
      discount_value: Number(body.discount_value) || 0,
      tax_rate: Number(body.tax_rate) || 0,
      withholding_tax_rate: Number(body.withholding_tax_rate) || 0,
      paid_amount: currentPaid,
    });

    // Determine status
    let newStatus = body.status;
    if (!newStatus) {
      if (calc.balance_due === 0 && calc.grand_total > 0 && currentPaid >= calc.grand_total) {
        newStatus = 'PAID';
      } else if (currentPaid > 0 && calc.balance_due > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = existing.rows[0].status;
      }
    }

    await db.execute({
      sql: `
        UPDATE documents SET
          client_id = ?,
          issue_date = ?,
          due_date = ?,
          valid_until = ?,
          payment_terms = ?,
          status = ?,
          subtotal = ?,
          discount_type = ?,
          discount_value = ?,
          discount_amount = ?,
          tax_rate = ?,
          tax_amount = ?,
          withholding_tax_rate = ?,
          withholding_tax_amount = ?,
          grand_total = ?,
          paid_amount = ?,
          balance_due = ?,
          notes = ?,
          payment_instructions = ?,
          signed_by = ?,
          signer_title = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [
        body.client_id,
        body.issue_date,
        body.due_date || null,
        body.valid_until || null,
        body.payment_terms || 'Full Payment',
        newStatus,
        calc.subtotal,
        body.discount_type || 'FIXED',
        Number(body.discount_value) || 0,
        calc.discount_amount,
        Number(body.tax_rate) || 0,
        calc.tax_amount,
        Number(body.withholding_tax_rate) || 0,
        calc.withholding_tax_amount,
        calc.grand_total,
        currentPaid,
        calc.balance_due,
        body.notes || null,
        body.payment_instructions || null,
        body.signed_by || 'Dhimas Ghofur A. F.',
        body.signer_title || 'Direktur Utama',
        params.id
      ]
    });

    // Replace items
    await db.execute({
      sql: 'DELETE FROM document_items WHERE document_id = ?',
      args: [params.id]
    });

    if (Array.isArray(body.items)) {
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unit_price) || 0;
        const disc = Number(item.discount_amount) || 0;
        const total = Math.max(0, qty * price - disc);

        await db.execute({
          sql: `
            INSERT INTO document_items (
              document_id, product_service_id, item_name, description,
              quantity, unit, unit_price, discount_amount, total_price, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            params.id,
            item.product_service_id || null,
            item.item_name,
            item.description || null,
            qty,
            item.unit || 'Paket',
            price,
            disc,
            total,
            i
          ]
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    
    // Check payments
    const payCheck = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM payments WHERE document_id = ?',
      args: [params.id]
    });

    if (Number(payCheck.rows[0].count) > 0) {
      // Jika sudah ada pembayaran, ubah status jadi CANCELLED bukan di-delete fisik
      await db.execute({
        sql: `UPDATE documents SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [params.id]
      });
      return NextResponse.json({ success: true, message: 'Dokumen dibatalkan karena memiliki riwayat pembayaran' });
    }

    await db.execute({
      sql: 'DELETE FROM documents WHERE id = ?',
      args: [params.id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
