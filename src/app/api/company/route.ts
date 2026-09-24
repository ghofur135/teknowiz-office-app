import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT * FROM company_profiles LIMIT 1');
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Company profile not found' }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    await db.execute({
      sql: `UPDATE company_profiles SET
        company_name = ?,
        brand_name = ?,
        slogan = ?,
        address = ?,
        city = ?,
        postal_code = ?,
        email = ?,
        phone = ?,
        website = ?,
        npwp = ?,
        nib = ?,
        bank_name = ?,
        bank_account_number = ?,
        bank_account_holder = ?,
        logo_path = ?,
        stamp_signature_path = ?,
        qr_verification_mode = ?,
        public_base_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      args: [
        body.company_name,
        body.brand_name,
        body.slogan,
        body.address,
        body.city,
        body.postal_code,
        body.email,
        body.phone,
        body.website,
        body.npwp,
        body.nib,
        body.bank_name,
        body.bank_account_number,
        body.bank_account_holder,
        body.logo_path || null,
        body.stamp_signature_path || null,
        body.qr_verification_mode || 'offline',
        body.public_base_url || 'https://billing.teknowiz.id',
        body.id || 1
      ]
    });

    return NextResponse.json({ success: true, message: 'Profil perusahaan berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
