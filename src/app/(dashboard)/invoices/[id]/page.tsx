'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { PaymentModal } from '@/components/PaymentModal';
import { formatRupiah } from '@/lib/terbilang';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Share2,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  Receipt,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const json = await res.json();
        setDocument(json);
      } else {
        router.push('/invoices');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDocument();
  }, [id]);

  if (loading || !document) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Detail Faktur Tagihan" />
        <div className="p-8 text-center text-slate-500">Memuat detail tagihan...</div>
      </div>
    );
  }

  // Pre-generate WhatsApp message text
  const waPhone = document.pic_phone ? document.pic_phone.replace(/[^0-9]/g, '') : '';
  const waMessage = encodeURIComponent(
    `Halo *${document.client_name}*,\n\nBerikut kami sampaikan Faktur Tagihan resmi dari *PT Tekno Wiz Indonesia*:\n` +
    `• No. Faktur: *${document.document_number}*\n` +
    `• Total Tagihan: *${formatRupiah(document.grand_total)}*\n` +
    `• Sisa Pembayaran: *${formatRupiah(document.balance_due)}*\n` +
    `• Jatuh Tempo: *${document.due_date || '-'}*\n\n` +
    `Pembayaran dapat ditransfer ke:\n` +
    `*Bank Mandiri*: 138-00-2299881-1\n` +
    `*a.n PT TEKNO WIZ INDONESIA*\n\n` +
    `Terima kasih atas kerjasamanya.`
  );

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title={`Faktur Tagihan: ${document.document_number}`}
        subtitle={`Diterbitkan untuk ${document.client_name}`}
      />

      <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">
                  {document.document_number}
                </h1>
                <StatusBadge status={document.status} />
              </div>
              <p className="text-xs text-slate-500">
                Tgl Terbit: {document.issue_date} • Jatuh Tempo: {document.due_date || '-'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {document.balance_due > 0 && document.status !== 'CANCELLED' && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Catat Pembayaran</span>
              </button>
            )}

            <Link
              href={`/print/invoice/${document.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak A4 / PDF</span>
            </Link>

            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${waMessage}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Client & Metadata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Klien */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Informasi Klien / Instansi</span>
            </h2>
            <div className="text-sm font-bold text-slate-900">{document.client_name}</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Kode Klien: <span className="font-mono">{document.client_code}</span> ({document.client_type})</div>
              {document.pic_name && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>PIC: {document.pic_name}</span>
                </div>
              )}
              {document.pic_phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>WhatsApp: {document.pic_phone}</span>
                </div>
              )}
              {document.client_address && (
                <div className="text-slate-500 pt-1 border-t border-slate-100">
                  {document.client_address}
                </div>
              )}
            </div>
          </div>

          {/* Card Info Tagihan */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Ketentuan & Termin</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Termin Pembayaran:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{document.payment_terms}</p>
              </div>
              <div>
                <span className="text-slate-500">No. Referensi / PO:</span>
                <p className="font-mono text-slate-900 mt-0.5">{document.reference_number || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Terbit:</span>
                <p className="font-medium text-slate-800 mt-0.5">{document.issue_date}</p>
              </div>
              <div>
                <span className="text-slate-500">Jatuh Tempo:</span>
                <p className="font-medium text-slate-800 mt-0.5">{document.due_date || '-'}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">Penandatangan:</span>
              <p className="font-semibold text-slate-900">{document.signed_by} ({document.signer_title})</p>
            </div>
          </div>
        </div>

        {/* Tabel Rincian Item */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rincian Barang & Layanan
            </h2>
          </div>
          <table className="table-corporate text-xs">
            <thead>
              <tr>
                <th className="w-10 text-center">#</th>
                <th>Deskripsi Item</th>
                <th className="text-center w-20">Qty</th>
                <th className="text-center w-24">Satuan</th>
                <th className="text-right w-32">Harga Satuan</th>
                <th className="text-right w-28">Diskon</th>
                <th className="text-right w-36">Total</th>
              </tr>
            </thead>
            <tbody>
              {document.items?.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="text-center text-slate-400 font-semibold">{idx + 1}</td>
                  <td>
                    <div className="font-semibold text-slate-900">{item.item_name}</div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="text-center font-mono">{item.quantity}</td>
                  <td className="text-center text-slate-600">{item.unit}</td>
                  <td className="text-right font-mono">{formatRupiah(item.unit_price)}</td>
                  <td className="text-right font-mono text-slate-500">
                    {item.discount_amount > 0 ? formatRupiah(item.discount_amount) : '-'}
                  </td>
                  <td className="text-right font-bold text-slate-900 font-mono">
                    {formatRupiah(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Kalkulasi */}
          <div className="p-6 bg-slate-50/70 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="text-xs text-slate-600 max-w-md space-y-2">
              <strong className="text-slate-800 uppercase">Instruksi Pembayaran:</strong>
              <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                {document.payment_instructions}
              </pre>
            </div>

            <div className="w-full md:w-80 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-mono font-semibold">{formatRupiah(document.subtotal)}</span>
              </div>
              {document.discount_amount > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Diskon:</span>
                  <span className="font-mono">- {formatRupiah(document.discount_amount)}</span>
                </div>
              )}
              {document.tax_amount > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>PPN ({document.tax_rate}%):</span>
                  <span className="font-mono">+ {formatRupiah(document.tax_amount)}</span>
                </div>
              )}
              {document.withholding_tax_amount > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>PPh 23 ({document.withholding_tax_rate}%):</span>
                  <span className="font-mono">- {formatRupiah(document.withholding_tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-slate-300 font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-sky-700">{formatRupiah(document.grand_total)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700 font-semibold border-t border-slate-200">
                <span>Telah Dibayar:</span>
                <span className="font-mono">{formatRupiah(document.paid_amount)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-slate-900 text-sm border-t-2 border-slate-900 pt-2">
                <span>Sisa Tagihan:</span>
                <span className="font-mono text-rose-700">{formatRupiah(document.balance_due)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Pembayaran & Kwitansi Resmi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Riwayat Pembayaran & Penerbitan Kwitansi Resmi
              </h2>
            </div>
            {document.balance_due > 0 && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="text-xs text-sky-600 font-semibold hover:underline"
              >
                + Catat Pembayaran Baru
              </button>
            )}
          </div>

          {(!document.payments || document.payments.length === 0) ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Belum ada pencatatan pembayaran untuk faktur tagihan ini.
            </div>
          ) : (
            <table className="table-corporate text-xs">
              <thead>
                <tr>
                  <th>No. Kwitansi</th>
                  <th>Tanggal Bayar</th>
                  <th>Nominal</th>
                  <th>Metode</th>
                  <th>No. Bukti / Ref</th>
                  <th>Terbilang Rupiah</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {document.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-mono font-bold text-slate-900">
                      {p.receipt_number}
                    </td>
                    <td>{p.payment_date}</td>
                    <td className="font-mono font-bold text-emerald-700">
                      {formatRupiah(p.amount)}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="text-slate-600 font-mono">{p.proof_reference || '-'}</td>
                    <td className="text-slate-600 italic text-[11px] max-w-[200px] truncate" title={p.terbilang}>
                      {p.terbilang}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/print/receipt/${p.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold hover:bg-sky-100 text-xs"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Cetak Kwitansi</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        document={document}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          fetchDocument();
        }}
      />
    </div>
  );
}
