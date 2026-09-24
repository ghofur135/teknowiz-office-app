import { getDb } from './db';

/**
 * Generator nomor dokumen otomatis dengan locking / sequence table
 * Format: [KODE]/TW/[YYYYMM]/[000]
 * Contoh:
 * - QUO/TW/202609/001
 * - INV/TW/202609/001
 * - KWT/TW/202609/001
 */
export async function generateDocumentNumber(
  docType: 'QUO' | 'INV' | 'KWT',
  dateInput?: string | Date
): Promise<string> {
  const db = getDb();
  const d = dateInput ? new Date(dateInput) : new Date();
  
  // Format YYYYMM (misal: 202609)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}${month}`;

  // Atomic update / upsert sequence
  await db.execute({
    sql: `
      INSERT INTO document_sequences (doc_type, year_month, last_sequence)
      VALUES (?, ?, 1)
      ON CONFLICT(doc_type, year_month) DO UPDATE SET
        last_sequence = document_sequences.last_sequence + 1;
    `,
    args: [docType, yearMonth]
  });

  const res = await db.execute({
    sql: `SELECT last_sequence FROM document_sequences WHERE doc_type = ? AND year_month = ?`,
    args: [docType, yearMonth]
  });

  const seq = Number(res.rows[0].last_sequence);
  const formattedSeq = String(seq).padStart(3, '0');

  return `${docType}/TW/${yearMonth}/${formattedSeq}`;
}
