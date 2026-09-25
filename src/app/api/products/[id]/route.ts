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
    const res = await db.execute({
      sql: 'SELECT * FROM product_services WHERE id = ?',
      args: [params.id]
    });
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
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

    await db.execute({
      sql: `UPDATE product_services SET
        code = ?,
        name = ?,
        category = ?,
        description = ?,
        default_price = ?,
        billing_unit = ?
      WHERE id = ?`,
      args: [
        body.code,
        body.name,
        body.category,
        body.description || null,
        Number(body.default_price) || 0,
        body.billing_unit || 'Bulan',
        params.id
      ]
    });

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
    // Soft delete / nonaktifkan
    await db.execute({
      sql: 'UPDATE product_services SET is_active = 0 WHERE id = ?',
      args: [params.id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
