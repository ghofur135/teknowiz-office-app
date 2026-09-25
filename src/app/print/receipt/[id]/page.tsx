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
  const [paperSize, setPaperSize] = useState<'A5_LANDSCAPE' | 'A4_PORTRAIT'>('A5_LANDSCAPE');

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
  const isA5 = paperSize === 'A5_LANDSCAPE';

  return (
    <div className="min-h-screen bg-slate-200/70 py-6 sm:py-10 print:py-0 print:bg-white text-slate-800">
      {/* Dynamic @page override for print dialog */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${isA5 ? 'A5 landscape' : 'A4 portrait'};
          margin: ${isA5 ? '4mm 6mm' : '10mm 12mm'};
        }
      `}} />

      {/* Print Controls (Hidden on print) */}
      <div className="no-print max-w-4xl mx-auto mb-6 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Format Selector Toggle */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-xs text-xs">
            <button
              type="button"
              onClick={() => setPaperSize('A5_LANDSCAPE')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                isA5
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 A5 Landscape (Standar Buku Kwitansi)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('A4_PORTRAIT')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                !isA5
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 A4 Portrait
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kwitansi ({isA5 ? 'A5' : 'A4'})</span>
          </button>
        </div>
      </div>

      {/* Sheet Container */}
      <div className="overflow-x-auto w-full px-2 sm:px-4 pb-10 flex justify-center print:p-0 print:m-0 print:overflow-visible">
        <div
          className={`print-page shrink-0 bg-white sm:shadow-lg sm:border sm:border-slate-300 leading-normal flex flex-col justify-between print:shadow-none print:border-none transition-all ${
            isA5
              ? 'w-[210mm] max-w-[210mm] min-h-[142mm] max-h-[148mm] p-[5mm_8mm] text-[10.5px]'
              : 'w-[210mm] max-w-[210mm] min-h-[200mm] p-[12mm_15mm] text-xs'
          }`}
        >
        {/* Receipt Border Container (Classic Corporate Border) */}
        <div className={`border-2 border-slate-900 flex flex-col justify-between h-full relative ${
          isA5 ? 'p-3.5' : 'p-6'
        }`}>
          {/* Header */}
          <div>
            <div className={`flex justify-between items-start border-b-2 border-slate-900 ${
              isA5 ? 'pb-2' : 'pb-4'
            }`}>
              <div>
                <CompanyBadge size={isA5 ? 'sm' : 'md'} />
                <div className="text-[9.5px] text-slate-600 mt-1 space-y-0.5 leading-tight">
                  <p>{comp.address}, {comp.city}</p>
                  <p>Email: {comp.email} • WA: {comp.phone}</p>
                  <p className="font-semibold text-slate-700">NPWP Badan: {comp.npwp} • PT Perorangan (Non-PKP)</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <h1 className={`font-black text-slate-900 tracking-tight leading-none uppercase ${
                  isA5 ? 'text-lg' : 'text-2xl'
                }`}>
                  KWITANSI PEMBAYARAN
                </h1>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  OFFICIAL PAYMENT RECEIPT
                </p>
                <div className={`font-mono font-extrabold text-slate-900 bg-slate-100 rounded border border-slate-400 ${
                  isA5 ? 'text-xs px-2 py-0.5 mt-1.5' : 'text-sm px-3 py-1 mt-2'
                }`}>
                  {payment.receipt_number}
                </div>
                <div className="mt-1 text-[10px] text-slate-600">
                  Tanggal: <strong className="text-slate-900">{payment.payment_date}</strong>
                </div>
              </div>
            </div>

            {/* Receipt Body: Standard Indonesian Kwitansi Form */}
            <div className={`${isA5 ? 'my-2.5 space-y-1.5 text-[10.5px]' : 'my-6 space-y-4 text-xs'}`}>
              {/* Row 1: Telah Diterima Dari */}
              <div className="grid grid-cols-12 items-baseline">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Telah Diterima Dari
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className={`col-span-8 font-extrabold text-slate-900 border-b border-dotted border-slate-400 pb-0.5 ${
                  isA5 ? 'text-xs' : 'text-sm'
                }`}>
                  {payment.client_name}
                </div>
              </div>

              {/* Row 2: Uang Sejumlah (Terbilang) */}
              <div className="grid grid-cols-12 items-start pt-0.5">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Uang Sejumlah
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className={`col-span-8 bg-slate-100 rounded border border-slate-300 italic font-semibold text-slate-900 leading-snug ${
                  isA5 ? 'p-1.5 text-[10px]' : 'p-2.5 text-xs'
                }`}>
                  "{payment.terbilang}"
                </div>
              </div>

              {/* Row 3: Untuk Pembayaran */}
              <div className="grid grid-cols-12 items-baseline pt-0.5">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Untuk Pembayaran
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 text-slate-800 border-b border-dotted border-slate-400 pb-0.5 leading-tight">
                  {payment.notes || `Pelunasan Faktur Tagihan Nomor ${payment.document_number}`}
                </div>
              </div>

              {/* Row 4: Referensi Faktur & Sisa */}
              <div className="grid grid-cols-12 items-baseline pt-0.5">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Faktur Terkait
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 font-mono text-slate-900 font-semibold text-[10px]">
                  {payment.document_number} (Grand Total: {formatRupiah(payment.grand_total)} | Sisa Tagihan Kini: {formatRupiah(payment.balance_due)})
                </div>
              </div>

              {/* Row 5: Metode Pembayaran */}
              <div className="grid grid-cols-12 items-baseline pt-0.5">
                <div className="col-span-3 font-bold text-slate-700 uppercase tracking-wide">
                  Metode & Rekening
                </div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 text-slate-700 text-[10px]">
                  <span className="font-semibold text-slate-900">{payment.payment_method}</span>{' '}
                  {payment.bank_destination && `• ${payment.bank_destination}`}{' '}
                  {payment.proof_reference && `(Ref: ${payment.proof_reference})`}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className={`border-t-2 border-slate-900 flex justify-between items-end ${
            isA5 ? 'mt-2 pt-2' : 'mt-8 pt-4'
          }`}>
            {/* Box Nominal Besar & QR Verification */}
            <div className="space-y-1.5">
              <div className={`border-2 sm:border-4 border-double border-slate-900 bg-slate-50 inline-block ${
                isA5 ? 'px-3.5 py-1.5' : 'px-5 py-2.5'
              }`}>
                <span className="text-[9px] font-bold text-slate-500 block uppercase">
                  Jumlah Dibayarkan:
                </span>
                <span className={`font-black font-mono text-slate-900 tracking-tight ${
                  isA5 ? 'text-base' : 'text-xl'
                }`}>
                  {formatRupiah(payment.amount)},-
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <DocumentQrCode
                  type="RECEIPT"
                  documentNumber={payment.receipt_number}
                  issueDate={payment.payment_date}
                  clientName={payment.client_name}
                  amount={payment.amount}
                  signerName={payment.received_by || 'Finance PT Tekno Wiz Indonesia'}
                  mode={comp.qr_verification_mode || 'offline'}
                  baseUrl={comp.public_base_url || 'https://billing.teknowiz.id'}
                  size={isA5 ? 40 : 50}
                />
                <div className="text-[8px] text-slate-500 leading-tight">
                  <p className="font-bold text-slate-700 uppercase">Kwitansi Sah</p>
                  <p>PT Tekno Wiz Indonesia</p>
                  <p className="font-mono">{payment.receipt_number}</p>
                </div>
              </div>
            </div>

            {/* Materai Placeholder (if eligible) & Receiver Sign */}
            <div className={`flex items-end text-center ${isA5 ? 'gap-3' : 'gap-6'}`}>
              {isEligibleMaterai && (
                <div className={`border border-dashed border-slate-400 rounded flex flex-col items-center justify-center text-[7px] text-slate-500 font-semibold uppercase leading-tight bg-slate-50/50 mb-1 ${
                  isA5 ? 'w-14 h-16 p-0.5' : 'w-20 h-24 p-1'
                }`}>
                  <span>METERAI</span>
                  <span>TEMPEL</span>
                  <span className="font-bold text-[8px] text-slate-700">10.000</span>
                </div>
              )}

              <div className={`text-center ${isA5 ? 'w-44' : 'w-52'}`}>
                <p className="text-[9.5px] text-slate-600">
                  Slawi, {payment.payment_date}
                </p>
                <p className="text-[9.5px] font-bold text-slate-800 uppercase mt-0.5">
                  Penerima Pembayaran,
                </p>

                {/* Stempel Sah PT Tekno Wiz Indonesia */}
                <div className={`flex items-center justify-center relative ${
                  isA5 ? 'h-12 my-0.5' : 'h-16 my-1'
                }`}>
                  <OfficialStamp size={isA5 ? 50 : 64} />
                </div>

                <p className="font-bold text-slate-900 text-[11px] underline decoration-slate-900">
                  {payment.received_by || 'Finance PT Tekno Wiz Indonesia'}
                </p>
                <p className="text-[9px] text-slate-500">PT Tekno Wiz Indonesia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
