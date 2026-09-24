'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRupiah } from '@/lib/terbilang';
import {
  ArrowLeft,
  Printer,
  ArrowRightCircle,
  Building,
  User,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const json = await res.json();
        setDocument(json);
      } else {
        router.push('/quotations');
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

  const handleConvert = async () => {
    if (!confirm('Apakah Anda yakin ingin mengonversi penawaran ini menjadi Faktur Tagihan (Invoice)?')) {
      return;
    }

    try {
      setConverting(true);
      const res = await fetch(`/api/documents/${id}/convert`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengonversi penawaran');
      }

      const data = await res.json();
      alert(`Berhasil! Faktur ${data.document_number} telah dibuat.`);
      router.push(`/invoices/${data.new_invoice_id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  };

  if (loading || !document) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Detail Surat Penawaran" />
        <div className="p-8 text-center text-slate-500">Memuat detail penawaran...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title={`Surat Penawaran: ${document.document_number}`}
        subtitle={`Ditujukan kepada ${document.client_name}`}
      />

      <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/quotations"
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
                Tgl Terbit: {document.issue_date} • Masa Berlaku: {document.valid_until || '30 Hari'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleConvert}
              disabled={converting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs disabled:opacity-50"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>{converting ? 'Mengonversi...' : 'Terbitkan Faktur Tagihan (Invoice)'}</span>
            </button>

            <Link
              href={`/print/quotation/${document.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak A4 / PDF</span>
            </Link>
          </div>
        </div>

        {/* Client & Metadata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Calon Klien / Mitra</span>
            </h2>
            <div className="text-sm font-bold text-slate-900">{document.client_name}</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Kode: <span className="font-mono">{document.client_code}</span> ({document.client_type})</div>
              {document.pic_name && <div>PIC: {document.pic_name}</div>}
              {document.pic_phone && <div>No. Telp / WhatsApp: {document.pic_phone}</div>}
              {document.client_address && (
                <div className="text-slate-500 pt-1 border-t border-slate-100">
                  {document.client_address}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Ketentuan Penawaran</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Termin Pembayaran:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{document.payment_terms}</p>
              </div>
              <div>
                <span className="text-slate-500">Masa Berlaku:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{document.valid_until || '30 Hari'}</p>
              </div>
              <div>
                <span className="text-slate-500">Penandatangan:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{document.signed_by}</p>
              </div>
              <div>
                <span className="text-slate-500">Jabatan:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{document.signer_title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Item Penawaran */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Paket Layanan yang Ditawarkan
            </h2>
          </div>
          <table className="table-corporate text-xs">
            <thead>
              <tr>
                <th className="w-10 text-center">#</th>
                <th>Deskripsi Item / Layanan</th>
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
              <strong className="text-slate-800 uppercase">Syarat & Ketentuan:</strong>
              <div className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                {document.notes || 'Penawaran berlaku 30 hari kalender.'}
              </div>
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
              <div className="flex justify-between py-2 border-t-2 border-slate-900 font-bold text-sm text-slate-900">
                <span>Grand Total Penawaran:</span>
                <span className="font-mono text-indigo-700">{formatRupiah(document.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
