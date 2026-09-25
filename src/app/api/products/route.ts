export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT * FROM product_services WHERE is_active = 1 ORDER BY category ASC, name ASC');
    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const res = await db.execute({
      sql: `INSERT INTO product_services (code, name, category, description, default_price, billing_unit, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1) RETURNING id`,
      args: [
        body.code,
        body.name,
        body.category || 'SAAS',
        body.description || null,
        Number(body.default_price) || 0,
        body.billing_unit || 'Bulan'
      ]
    });

    return NextResponse.json({ success: true, id: res.rows[0]?.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
