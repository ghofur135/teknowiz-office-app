import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const res = await db.execute({
      sql: 'SELECT * FROM clients WHERE id = ?',
      args: [params.id]
    });
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
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
      sql: `UPDATE clients SET
        name = ?,
        pic_name = ?,
        pic_phone = ?,
        pic_email = ?,
        address = ?,
        client_type = ?,
        tax_number = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      args: [
        body.name,
        body.pic_name || null,
        body.pic_phone,
        body.pic_email || null,
        body.address || null,
        body.client_type || 'B2B',
        body.tax_number || null,
        body.notes || null,
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
    // Cek apakah ada invoice / quotation yang memakai klien ini
    const docCheck = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM documents WHERE client_id = ?',
      args: [params.id]
    });
    if (Number(docCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Klien tidak dapat dihapus karena sudah memiliki riwayat dokumen/transaksi' },
        { status: 400 }
      );
    }

    await db.execute({
      sql: 'DELETE FROM clients WHERE id = ?',
      args: [params.id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
