export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const db = getDb();
    let query = 'SELECT * FROM company_documents';
    const args: any[] = [];

    if (category && category !== 'ALL') {
      query += ' WHERE document_category = ?';
      args.push(category);
    }

    query += ' ORDER BY id DESC';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const category = (formData.get('document_category') as string) || 'LAINNYA';
    const documentNumber = formData.get('document_number') as string | null;
    const issueDate = formData.get('issue_date') as string | null;
    const expiryDate = formData.get('expiry_date') as string | null;
    const isLifetime = formData.get('is_lifetime') === 'true' || formData.get('is_lifetime') === '1' ? 1 : 0;
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File dokumen wajib dilampirkan' }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul dokumen wajib diisi' }, { status: 400 });
    }

    // Validasi ukuran (Maksimal 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas maksimal 25MB' }, { status: 400 });
    }

    // Pastikan direktori tujuan tersedia
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'legality');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate nama file yang aman dan unik
    const ext = path.extname(file.name).toLowerCase();
    const originalBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const savedFileName = `${Date.now()}_${originalBase}${ext}`;
    const destinationPath = path.join(uploadDir, savedFileName);

    // Simpan buffer file
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(destinationPath, Buffer.from(arrayBuffer));

    const relativeFilePath = `/uploads/legality/${savedFileName}`;

    // Simpan metadata ke database
    const db = getDb();
    const insertRes = await db.execute({
      sql: `INSERT INTO company_documents (
        document_category, title, document_number, file_path, file_name,
        file_size, file_type, issue_date, expiry_date, is_lifetime, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        category,
        title.trim(),
        documentNumber?.trim() || null,
        relativeFilePath,
        file.name,
        file.size,
        file.type || 'application/octet-stream',
        issueDate || null,
        isLifetime ? null : (expiryDate || null),
        isLifetime,
        notes?.trim() || null
      ]
    });

    const newId = Number(insertRes.lastInsertRowid);
    const createdDoc = await db.execute({
      sql: 'SELECT * FROM company_documents WHERE id = ?',
      args: [newId]
    });

    return NextResponse.json({
      success: true,
      message: 'Dokumen legalitas berhasil diunggah',
      document: createdDoc.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload legality error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
