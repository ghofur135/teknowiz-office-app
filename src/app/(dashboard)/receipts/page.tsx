'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { formatRupiah } from '@/lib/terbilang';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  CreditCard,
  Building,
  ExternalLink
} from 'lucide-react';

export default function ReceiptsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const json = await res.json();
        setPayments(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.receipt_number.toLowerCase().includes(q) ||
      p.client_name?.toLowerCase().includes(q) ||
      p.document_number?.toLowerCase().includes(q) ||
      p.terbilang?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Buku Kwitansi & Riwayat Pembayaran (Receipts)"
        subtitle="Arsip bukti penerimaan pembayaran sah PT Tekno Wiz Indonesia"
      />

      <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Top Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nomor kwitansi, invoice, klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 sm:w-80 pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="text-xs text-slate-500">
            Total Kwitansi Diterbitkan: <strong className="text-slate-900">{payments.length}</strong>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-corporate text-xs">
              <thead>
                <tr>
                  <th>No. Kwitansi Resmi</th>
                  <th>Tanggal Bayar</th>
                  <th>Faktur Tagihan</th>
                  <th>Klien / Instansi</th>
                  <th>Metode</th>
                  <th>Nominal Diterima</th>
                  <th>Terbilang Bahasa Indonesia</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      Memuat buku kwitansi...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Belum ada kwitansi pembayaran tercatat.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="font-bold text-slate-900 font-mono">
                        <Link
                          href={`/print/receipt/${item.id}`}
                          target="_blank"
                          className="hover:text-sky-600 inline-flex items-center gap-1"
                        >
                          <span>{item.receipt_number}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="text-slate-600 whitespace-nowrap">{item.payment_date}</td>
                      <td>
                        <Link
                          href={`/invoices/${item.document_id}`}
                          className="font-mono text-sky-600 font-medium hover:underline"
                        >
                          {item.document_number}
                        </Link>
                      </td>
                      <td className="font-semibold text-slate-900 truncate max-w-[160px]">
                        {item.client_name}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {item.payment_method}
                        </span>
                      </td>
                      <td className="font-bold text-emerald-700 font-mono whitespace-nowrap">
                        {formatRupiah(item.amount)}
                      </td>
                      <td
                        className="text-slate-600 italic text-[11px] max-w-[220px] truncate"
                        title={item.terbilang}
                      >
                        {item.terbilang}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/print/receipt/${item.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold hover:bg-sky-100 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak A4</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
