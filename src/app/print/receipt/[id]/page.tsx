'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CompanyBadge } from '@/components/CompanyBadge';
import { DocumentQrCode } from '@/components/DocumentQrCode';
import { OfficialStamp } from '@/components/OfficialStamp';
import { formatRupiah } from '@/lib/terbilang';
import { ArrowLeft, Printer } from 'lucide-react';

export default function PrintReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/payments/${id}`);
        if (res.ok) {
          setPayment(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading || !payment) {
    return <div className="p-8 text-center text-slate-500">Memuat kwitansi pembayaran...</div>;
  }

  const comp = payment.company || {
    company_name: 'PT Tekno Wiz Indonesia',
    slogan: 'Membangun Ekosistem Digital Berkelanjutan',
    address: 'Slawi Kulon, Kec. Slawi',
    city: 'Slawi, Kabupaten Tegal, Jawa Tengah 52411',
    email: 'halo@teknowiz.id',
    phone: '+62 878 1127 8630',
    website: 'https://teknowiz.id',
    npwp: '31.849.201.8-501.000',
    nib: '0220109123456',
  };

  const isEligibleMaterai = payment.amount >= 5000000;

  return (
    <div className="min-h-screen bg-slate-200/70 py-6 sm:py-10 print:py-0 print:bg-white text-slate-800">
      {/* Print Controls */}
      <div className="no-print max-w-4xl mx-auto mb-6 px-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">
            Ukuran Cetak: Standar A4 (1 Lembar)
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kwitansi Sah (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="print-page w-full max-w-[210mm] mx-auto bg-white p-[12mm_15mm] sm:shadow-lg sm:border sm:border-slate-300 text-xs leading-relaxed flex flex-col justify-between print:shadow-none print:border-none min-h-[140mm]">
        {/* Receipt Border Container (Classic Corporate Border) */}
        <div className="border-2 border-slate-900 p-6 flex flex-col justify-between h-full relative">
          {/* Header */}
          <div>
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <CompanyBadge size="md" />
                <div className="text-[10px] text-slate-600 mt-2 space-y-0.5 leading-tight">
                  <p>{comp.address}, {comp.city}</p>
                  <p>Email: {comp.email} • WA: {comp.phone}</p>
                  <p>NPWP Badan: {comp.npwp}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                  KWITANSI PEMBAYARAN
                </h1>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                  OFFICIAL PAYMENT RECEIPT
                </p>
                <div className="text-sm font-mono font-extrabold text-slate-900 mt-2 px-3 py-1 bg-slate-100 rounded border border-slate-400">
                  {payment.receipt_number}
                </div>
                <div className="mt-1 text-[11px] text-slate-600">
                  Tanggal: <strong className="text-slate-900">{payment.payment_date}</strong>
                </div>
              </div>
            </div>

            {/* Receipt Body: Standard Indonesian Kwitansi Form */}
            <div className="my-6 space-y-4 text-xs">
              {/* Row 1: Telah Diterima Dari */}
              <div className="grid grid-cols-12 items-baseline">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Telah Diterima Dari
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 font-extrabold text-slate-900 text-sm border-b border-dotted border-slate-400 pb-1">
                  {payment.client_name}
                </div>
              </div>

              {/* Row 2: Uang Sejumlah (Terbilang) */}
              <div className="grid grid-cols-12 items-start pt-1">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Uang Sejumlah
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 bg-slate-100 p-2.5 rounded border border-slate-300 italic font-semibold text-slate-900 leading-normal">
                  "{payment.terbilang}"
                </div>
              </div>

              {/* Row 3: Untuk Pembayaran */}
              <div className="grid grid-cols-12 items-baseline pt-1">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Untuk Pembayaran
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 text-slate-800 border-b border-dotted border-slate-400 pb-1 leading-relaxed">
                  {payment.notes || `Pelunasan Faktur Tagihan Nomor ${payment.document_number}`}
                </div>
              </div>

              {/* Row 4: Referensi Faktur & Metode */}
              <div className="grid grid-cols-12 items-baseline pt-1">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Faktur Terkait
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 font-mono text-slate-900 font-semibold">
                  {payment.document_number} (Grand Total: {formatRupiah(payment.grand_total)} | Sisa Tagihan Kini: {formatRupiah(payment.balance_due)})
                </div>
              </div>

              {/* Row 5: Metode Pembayaran */}
              <div className="grid grid-cols-12 items-baseline pt-1">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Metode & Rekening
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 text-slate-700">
                  <span className="font-semibold">{payment.payment_method}</span>{' '}
                  {payment.bank_destination && `• ${payment.bank_destination}`}{' '}
                  {payment.proof_reference && `(Ref: ${payment.proof_reference})`}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900 flex justify-between items-end">
            {/* Box Nominal Besar */}
            <div className="space-y-2">
              <div className="border-4 border-double border-slate-900 px-5 py-2.5 bg-slate-50 inline-block">
                <span className="text-xs font-bold text-slate-500 block uppercase">
                  Jumlah Dibayarkan:
                </span>
                <span className="text-xl font-black font-mono text-slate-900 tracking-tight">
                  {formatRupiah(payment.amount)},-
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <DocumentQrCode
                  type="RECEIPT"
                  documentNumber={payment.receipt_number}
                  issueDate={payment.payment_date}
                  clientName={payment.client_name}
                  amount={payment.amount}
                  signerName={payment.received_by || 'Finance PT Tekno Wiz Indonesia'}
                  mode={comp.qr_verification_mode || 'offline'}
                  baseUrl={comp.public_base_url || 'https://billing.teknowiz.id'}
                  size={50}
                />
                <div className="text-[9px] text-slate-500 leading-tight">
                  <p className="font-bold text-slate-700 uppercase">Kwitansi Sah</p>
                  <p>PT Tekno Wiz Indonesia</p>
                  <p className="font-mono">{payment.receipt_number}</p>
                </div>
              </div>
            </div>

            {/* Materai Placeholder (if eligible) & Receiver Sign */}
            <div className="flex items-end gap-6 text-center">
              {isEligibleMaterai && (
                <div className="w-20 h-24 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center p-1 text-[8px] text-slate-500 font-semibold uppercase leading-tight bg-slate-50/50 mb-2">
                  <span>METERAI</span>
                  <span>TEMPEL</span>
                  <span className="font-bold text-[9px] text-slate-700">10.000</span>
                </div>
              )}

              <div className="text-center w-52">
                <p className="text-[10px] text-slate-600">
                  Slawi, {payment.payment_date}
                </p>
                <p className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">
                  Penerima Pembayaran,
                </p>

                {/* Stempel Sah PT Tekno Wiz Indonesia */}
                <div className="h-16 flex items-center justify-center my-1 relative">
                  <OfficialStamp size={64} />
                </div>

                <p className="font-bold text-slate-900 text-xs underline decoration-slate-900">
                  {payment.received_by || 'Finance PT Tekno Wiz Indonesia'}
                </p>
                <p className="text-[10px] text-slate-500">PT Tekno Wiz Indonesia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
