import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    // 1. Total Tagihan Diterbitkan Bulan Ini (Invoices)
    const omzetRes = await db.execute({
      sql: `
        SELECT COALESCE(SUM(grand_total), 0) as total 
        FROM documents 
        WHERE document_type = 'INVOICE' AND status != 'CANCELLED' AND strftime('%Y-%m', issue_date) = ?
      `,
      args: [currentMonth]
    });
    const totalOmzetBulanIni = Number(omzetRes.rows[0].total);

    // 2. Total Piutang Belum Terbayar (Unpaid / Partial)
    const unpaidRes = await db.execute(`
      SELECT COALESCE(SUM(balance_due), 0) as total, COUNT(*) as count
      FROM documents
      WHERE document_type = 'INVOICE' AND status IN ('DRAFT', 'SENT', 'PARTIAL', 'OVERDUE')
    `);
    const unpaidTotal = Number(unpaidRes.rows[0].total);
    const unpaidCount = Number(unpaidRes.rows[0].count);

    // 3. Total Kas Diterima (Cash Inflow)
    const inflowRes = await db.execute({
      sql: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE strftime('%Y-%m', payment_date) = ?
      `,
      args: [currentMonth]
    });
    const cashInflowBulanIni = Number(inflowRes.rows[0].total);

    // 4. Hitung Dokumen berdasarkan Status
    const statsRes = await db.execute(`
      SELECT 
        SUM(CASE WHEN document_type = 'INVOICE' AND status = 'PAID' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN document_type = 'INVOICE' AND status != 'CANCELLED' THEN 1 ELSE 0 END) as total_invoices,
        SUM(CASE WHEN document_type = 'QUOTATION' THEN 1 ELSE 0 END) as total_quotations
      FROM documents
    `);
    const paidInvoices = Number(statsRes.rows[0].paid_invoices || 0);
    const totalInvoices = Number(statsRes.rows[0].total_invoices || 0);
    const totalQuotations = Number(statsRes.rows[0].total_quotations || 0);

    // 5. Invoices Jatuh Tempo (Overdue)
    const overdueRes = await db.execute({
      sql: `
        SELECT 
          d.id, d.document_number, d.due_date, d.balance_due, d.grand_total,
          c.name as client_name, c.pic_phone
        FROM documents d
        JOIN clients c ON d.client_id = c.id
        WHERE d.document_type = 'INVOICE' 
          AND d.balance_due > 0 
          AND d.due_date IS NOT NULL 
          AND d.due_date < ?
          AND d.status != 'CANCELLED'
        ORDER BY d.due_date ASC
        LIMIT 5
      `,
      args: [today]
    });

    // 6. Transaksi Terbaru (5 dokumen terakhir)
    const recentRes = await db.execute(`
      SELECT 
        d.id, d.document_type, d.document_number, d.issue_date, d.grand_total, d.balance_due, d.status,
        c.name as client_name
      FROM documents d
      JOIN clients c ON d.client_id = c.id
      ORDER BY d.id DESC
      LIMIT 6
    `);

    return NextResponse.json({
      metrics: {
        totalOmzetBulanIni,
        unpaidTotal,
        unpaidCount,
        cashInflowBulanIni,
        paidInvoices,
        totalInvoices,
        totalQuotations,
      },
      overdueAlerts: overdueRes.rows,
      recentDocuments: recentRes.rows
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
