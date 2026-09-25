export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateDocumentNumber } from '@/lib/number-generator';
import { calculateDocumentFinancials } from '@/lib/calculator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');     // 'QUOTATION' | 'INVOICE'
    const status = searchParams.get('status'); // 'DRAFT', 'SENT', etc.
    const search = searchParams.get('q');      // search query

    const db = getDb();
    let query = `
      SELECT 
        d.*,
        c.name as client_name,
        c.client_code,
        c.client_type,
        c.pic_name,
        c.pic_phone
      FROM documents d
      JOIN clients c ON d.client_id = c.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (type) {
      query += ' AND d.document_type = ?';
      args.push(type.toUpperCase());
    }

    if (status && status !== 'ALL') {
      query += ' AND d.status = ?';
      args.push(status.toUpperCase());
    }

    if (search) {
      query += ' AND (d.document_number LIKE ? OR c.name LIKE ? OR d.notes LIKE ?)';
      const term = `%${search}%`;
      args.push(term, term, term);
    }

    query += ' ORDER BY d.issue_date DESC, d.id DESC';

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

    const docType: 'QUOTATION' | 'INVOICE' = body.document_type === 'QUOTATION' ? 'QUOTATION' : 'INVOICE';
    const numberCode = docType === 'QUOTATION' ? 'QUO' : 'INV';
    
    // Generate atomic sequence number
    const documentNumber = await generateDocumentNumber(numberCode, body.issue_date);

    // Calculate financials
    const calc = calculateDocumentFinancials({
      items: body.items || [],
      discount_type: body.discount_type || 'FIXED',
      discount_value: Number(body.discount_value) || 0,
      tax_rate: Number(body.tax_rate) || 0,
      withholding_tax_rate: Number(body.withholding_tax_rate) || 0,
      paid_amount: 0,
    });

    const docRes = await db.execute({
      sql: `
        INSERT INTO documents (
          document_type, document_number, reference_number, client_id,
          issue_date, due_date, valid_until, payment_terms, status,
          subtotal, discount_type, discount_value, discount_amount,
          tax_rate, tax_amount, withholding_tax_rate, withholding_tax_amount,
          grand_total, paid_amount, balance_due,
          notes, payment_instructions, signed_by, signer_title
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?
        ) RETURNING id
      `,
      args: [
        docType,
        documentNumber,
        body.reference_number || null,
        body.client_id,
        body.issue_date,
        body.due_date || null,
        body.valid_until || null,
        body.payment_terms || 'Full Payment',
        body.status || 'DRAFT',
        calc.subtotal,
        body.discount_type || 'FIXED',
        Number(body.discount_value) || 0,
        calc.discount_amount,
        Number(body.tax_rate) || 0,
        calc.tax_amount,
        Number(body.withholding_tax_rate) || 0,
        calc.withholding_tax_amount,
        calc.grand_total,
        0,
        calc.grand_total,
        body.notes || null,
        body.payment_instructions || null,
        body.signed_by || 'Dhimas Ghofur A. F.',
        body.signer_title || 'Direktur Utama',
      ]
    });

    const documentId = docRes.rows[0].id;

    // Insert items
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
            documentId,
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

    return NextResponse.json({
      success: true,
      id: documentId,
      document_number: documentNumber
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
