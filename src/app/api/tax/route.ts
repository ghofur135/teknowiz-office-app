export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const targetYear = searchParams.get('year') || String(now.getFullYear());
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Ambil Data Profil Perusahaan
    const compRes = await db.execute('SELECT company_name, npwp, nib, tax_scheme, suket_pp55_number, is_pkp FROM company_profiles LIMIT 1');
    const company = compRes.rows[0] || {
      company_name: 'PT Tekno Wiz Indonesia',
      npwp: '31.849.201.8-501.000',
      nib: '0220109123456',
      tax_scheme: 'PP55_FINAL',
      suket_pp55_number: 'KET-01428/WPJ.10/KP.0403/2026',
      is_pkp: 0,
    };

    // 2. Ambil Omzet Bulanan dari Dokumen Invoices yang Sah (status != CANCELLED)
    const invoicesRes = await db.execute({
      sql: `
        SELECT 
          strftime('%Y-%m', issue_date) as month_key,
          COUNT(*) as invoice_count,
          COALESCE(SUM(grand_total), 0) as total_turnover
        FROM documents
        WHERE document_type = 'INVOICE' 
          AND status != 'CANCELLED'
          AND strftime('%Y', issue_date) = ?
        GROUP BY strftime('%Y-%m', issue_date)
      `,
      args: [targetYear]
    });

    const invoiceMonthMap = new Map<string, { count: number; turnover: number }>();
    for (const row of invoicesRes.rows) {
      invoiceMonthMap.set(String(row.month_key), {
        count: Number(row.invoice_count),
        turnover: Number(row.total_turnover)
      });
    }

    // 3. Ambil Catatan Penyetoran Pajak yang Tersimpan
    const settlementsRes = await db.execute({
      sql: `
        SELECT * FROM tax_settlements 
        WHERE tax_year_month LIKE ?
      `,
      args: [`${targetYear}-%`]
    });

    const settlementMap = new Map<string, any>();
    for (const row of settlementsRes.rows) {
      settlementMap.set(String(row.tax_year_month), row);
    }

    // 4. Susun 12 Bulan (Januari s.d. Desember)
    const monthsData = [];
    let totalYearTurnover = 0;
    let totalYearTaxDue = 0;
    let totalPaidTax = 0;
    let totalUnpaidTax = 0;

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${targetYear}-${String(m).padStart(2, '0')}`;
      const monthName = `${MONTH_NAMES_ID[m - 1]} ${targetYear}`;

      const invData = invoiceMonthMap.get(monthKey) || { count: 0, turnover: 0 };
      const setlData = settlementMap.get(monthKey);

      const turnover = invData.turnover;
      const taxRate = 0.005; // PPh Final 0.5% PP 55/2022
      const taxAmount = Math.round(turnover * taxRate);

      let status = setlData?.status || (taxAmount > 0 ? 'UNPAID' : 'NO_TRANSACTION');
      if (setlData?.status === 'PAID') {
        status = 'PAID';
        totalPaidTax += taxAmount;
      } else if (taxAmount > 0) {
        status = 'UNPAID';
        totalUnpaidTax += taxAmount;
      }

      totalYearTurnover += turnover;
      totalYearTaxDue += taxAmount;

      // Hitung batas waktu penyetoran (Tgl 15 bulan berikutnya)
      let deadlineMonth = m + 1;
      let deadlineYear = Number(targetYear);
      if (deadlineMonth > 12) {
        deadlineMonth = 1;
        deadlineYear += 1;
      }
      const deadlineStr = `15 ${MONTH_NAMES_ID[deadlineMonth - 1]} ${deadlineYear}`;

      monthsData.push({
        monthKey,
        monthNumber: m,
        monthName,
        invoiceCount: invData.count,
        turnover,
        taxRate: '0,5%',
        taxAmount,
        kapCode: setlData?.kap_code || '411128',
        kjsCode: setlData?.kjs_code || '420',
        billingCode: setlData?.billing_code || '',
        ntpnNumber: setlData?.ntpn_number || '',
        bankName: setlData?.bank_name || '',
        paymentDate: setlData?.payment_date || '',
        status,
        notes: setlData?.notes || '',
        deadline: deadlineStr,
        isCurrentMonth: monthKey === currentMonthStr
      });
    }

    // 5. Metrik Bulan Berjalan
    const currentMonthObj = monthsData.find((m) => m.monthKey === currentMonthStr) || monthsData[0];

    return NextResponse.json({
      year: targetYear,
      company,
      summary: {
        totalYearTurnover,
        totalYearTaxDue,
        totalPaidTax,
        totalUnpaidTax,
        currentMonthKey: currentMonthStr,
        currentMonthTurnover: currentMonthObj.turnover,
        currentMonthTaxDue: currentMonthObj.taxAmount,
        currentMonthStatus: currentMonthObj.status,
        currentMonthNtpn: currentMonthObj.ntpnNumber,
        currentMonthDeadline: currentMonthObj.deadline
      },
      months: monthsData
    });
  } catch (error: any) {
    console.error('Error in GET /api/tax:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const {
      tax_year_month,
      billing_code,
      ntpn_number,
      bank_name,
      payment_date,
      status = 'PAID',
      notes = ''
    } = body;

    if (!tax_year_month || typeof tax_year_month !== 'string') {
      return NextResponse.json(
        { error: 'Masa pajak (tax_year_month) wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Ambil omzet riil bulan tersebut dari database invoices
    const invRes = await db.execute({
      sql: `
        SELECT COALESCE(SUM(grand_total), 0) as total_turnover
        FROM documents
        WHERE document_type = 'INVOICE'
          AND status != 'CANCELLED'
          AND strftime('%Y-%m', issue_date) = ?
      `,
      args: [tax_year_month]
    });

    const grossTurnover = Number(invRes.rows[0]?.total_turnover || 0);
    const taxAmount = Math.round(grossTurnover * 0.005);

    // 2. Simpan atau perbarui data settlement (Upsert)
    const existing = await db.execute({
      sql: 'SELECT id FROM tax_settlements WHERE tax_year_month = ?',
      args: [tax_year_month]
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: `
          UPDATE tax_settlements
          SET 
            gross_turnover = ?,
            tax_amount = ?,
            billing_code = ?,
            ntpn_number = ?,
            bank_name = ?,
            payment_date = ?,
            status = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE tax_year_month = ?
        `,
        args: [
          grossTurnover,
          taxAmount,
          billing_code || '',
          ntpn_number || '',
          bank_name || '',
          payment_date || new Date().toISOString().split('T')[0],
          status,
          notes,
          tax_year_month
        ]
      });
    } else {
      await db.execute({
        sql: `
          INSERT INTO tax_settlements (
            tax_year_month, gross_turnover, tax_rate, tax_amount, kap_code, kjs_code,
            billing_code, ntpn_number, bank_name, payment_date, status, notes
          ) VALUES (?, ?, 0.005, ?, '411128', '420', ?, ?, ?, ?, ?, ?)
        `,
        args: [
          tax_year_month,
          grossTurnover,
          taxAmount,
          billing_code || '',
          ntpn_number || '',
          bank_name || '',
          payment_date || new Date().toISOString().split('T')[0],
          status,
          notes
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: `Pencatatan pajak masa ${tax_year_month} berhasil diperbarui.`
    });
  } catch (error: any) {
    console.error('Error in POST /api/tax:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
