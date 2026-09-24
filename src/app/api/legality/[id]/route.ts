import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const res = await db.execute({
      sql: 'SELECT * FROM company_documents WHERE id = ?',
      args: [params.id]
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
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
    const res = await db.execute({
      sql: 'SELECT * FROM company_documents WHERE id = ?',
      args: [params.id]
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    const doc = res.rows[0];

    // Hapus file fisik dari disk jika ada
    if (doc.file_path && typeof doc.file_path === 'string') {
      const sanitizedRelative = doc.file_path.replace(/^\/+/, '');
      const physicalPath = path.join(process.cwd(), 'public', sanitizedRelative);
      if (fs.existsSync(physicalPath)) {
        try {
          fs.unlinkSync(physicalPath);
        } catch (e) {
          console.error('Failed to delete physical file:', e);
        }
      }
    }

    // Hapus record dari database
    await db.execute({
      sql: 'DELETE FROM company_documents WHERE id = ?',
      args: [params.id]
    });

    return NextResponse.json({
      success: true,
      message: 'Dokumen legalitas berhasil dihapus'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
