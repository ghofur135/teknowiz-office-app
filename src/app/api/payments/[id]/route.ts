export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();

    const payRes = await db.execute({
      sql: `
        SELECT 
          p.*,
          d.document_number,
          d.document_type,
          d.grand_total,
          d.paid_amount,
          d.balance_due,
          d.issue_date as invoice_date,
          c.name as client_name,
          c.client_code,
          c.pic_name,
          c.pic_phone,
          c.address as client_address
        FROM payments p
        JOIN documents d ON p.document_id = d.id
        JOIN clients c ON d.client_id = c.id
        WHERE p.id = ?
      `,
      args: [params.id]
    });

    if (payRes.rows.length === 0) {
      return NextResponse.json({ error: 'Data pembayaran tidak ditemukan' }, { status: 404 });
    }

    const compRes = await db.execute('SELECT * FROM company_profiles LIMIT 1');

    return NextResponse.json({
      ...payRes.rows[0],
      company: compRes.rows[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
