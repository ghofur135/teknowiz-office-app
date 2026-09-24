'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiah, terbilangRupiah } from '@/lib/terbilang';
import { X, CreditCard, CheckCircle2, Printer } from 'lucide-react';
import Link from 'next/link';

interface PaymentModalProps {
  document: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({
  document,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'QRIS' | 'TUNAI'>('BANK_TRANSFER');
  const [bankDestination, setBankDestination] = useState('Bank Mandiri (138-00-2299881-1)');
  const [proofReference, setProofReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState('Finance PT Tekno Wiz Indonesia');
  const [submitting, setSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);

  useEffect(() => {
    if (document) {
      setAmount(document.balance_due || document.grand_total || 0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes(`Pembayaran faktur ${document.document_number}`);
      setReceiptResult(null);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const terbilangPreview = amount > 0 ? terbilangRupiah(amount) : 'Nol Rupiah';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: document.id,
          amount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          bank_destination: bankDestination,
          proof_reference: proofReference || null,
          notes: notes || null,
          received_by: receivedBy,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mencatat pembayaran');
      }

      const data = await res.json();
      setReceiptResult(data);
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Catat Pembayaran & Terbitkan Kwitansi
              </h3>
              <p className="text-xs text-slate-500">
                Faktur: <span className="font-mono font-semibold">{document.document_number}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receiptResult ? (
          /* Success Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Pembayaran Berhasil Dicatat!
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Kwitansi resmi telah diterbitkan dengan nomor:
              </p>
              <div className="text-base font-mono font-bold text-sky-700 mt-2 bg-sky-50 py-2 px-4 rounded-lg inline-block border border-sky-200">
                {receiptResult.receipt_number}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-xs text-left border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatRupiah(amount)}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 italic">
                "{receiptResult.terbilang}"
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Sisa Tagihan Faktur:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatRupiah(receiptResult.balance_due)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Faktur Kini:</span>
                <span className="font-bold text-emerald-700">
                  {receiptResult.invoice_status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href={`/print/receipt/${receiptResult.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kwitansi Resmi (A4)</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500">Total Tagihan:</span>{' '}
                <strong className="font-mono">{formatRupiah(document.grand_total)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Sisa Tagihan:</span>{' '}
                <strong className="font-mono text-amber-700">{formatRupiah(document.balance_due)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Tanggal Bayar *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                >
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                  <option value="QRIS">QRIS Standar</option>
                  <option value="TUNAI">Tunai / Kasir</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Nominal Pembayaran (Rp) *
              </label>
              <input
                type="number"
                min="1000"
                max={document.balance_due}
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-300 font-mono text-slate-900"
              />
              <div className="p-2 rounded bg-sky-50/60 border border-sky-200 text-[11px] text-sky-900 italic">
                Terbilang: <span className="font-semibold">{terbilangPreview}</span>
              </div>
            </div>

            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Rekening Bank Tujuan
                </label>
                <input
                  type="text"
                  value={bankDestination}
                  onChange={(e) => setBankDestination(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  No. Bukti / Referensi Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: REF98327129"
                  value={proofReference}
                  onChange={(e) => setProofReference(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Diterima Oleh
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Keterangan Pembayaran
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Catat & Terbitkan Kwitansi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
