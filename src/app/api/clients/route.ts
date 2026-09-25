export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT * FROM clients ORDER BY id DESC');
    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    // Auto-generate client code jika belum ada
    let clientCode = body.client_code;
    if (!clientCode) {
      const year = new Date().getFullYear();
      const countRes = await db.execute('SELECT COUNT(*) as count FROM clients');
      const nextNum = Number(countRes.rows[0].count) + 1;
      clientCode = `CLI-${year}-${String(nextNum).padStart(3, '0')}`;
    }

    const res = await db.execute({
      sql: `INSERT INTO clients (
        client_code, name, pic_name, pic_phone, pic_email, address, client_type, tax_number, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        clientCode,
        body.name,
        body.pic_name || null,
        body.pic_phone,
        body.pic_email || null,
        body.address || null,
        body.client_type || 'B2B',
        body.tax_number || null,
        body.notes || null,
      ]
    });

    return NextResponse.json({ success: true, id: res.rows[0]?.id, client_code: clientCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
