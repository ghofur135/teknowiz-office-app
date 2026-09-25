'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRupiah } from '@/lib/terbilang';
import {
  FileText,
  Plus,
  Search,
  Printer,
  ChevronRight,
  CreditCard,
  Share2,
  Calendar,
  AlertCircle,
  Filter
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModalDoc, setPaymentModalDoc] = useState<any>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/api/documents?type=INVOICE`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setInvoices(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const tabs = [
    { key: 'ALL', label: 'Semua' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'SENT', label: 'Terkirim' },
    { key: 'PARTIAL', label: 'Sebagian' },
    { key: 'PAID', label: 'Lunas' },
    { key: 'OVERDUE', label: 'Jatuh Tempo' },
    { key: 'CANCELLED', label: 'Dibatalkan' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Daftar Faktur Tagihan (Invoices)"
        subtitle="Kelola penerbitan faktur tagihan resmi PT Tekno Wiz Indonesia"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 flex-1 overflow-y-auto">
        {/* Header Bar: Filter tabs & Action */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b lg:border-b-0 border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Cari nomor / klien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </form>

            <Link
              href="/invoices/new"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Faktur Baru</span>
            </Link>
          </div>
        </div>

        {/* Invoices Table Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-corporate text-xs">
              <thead>
                <tr>
                  <th>No. Faktur</th>
                  <th>Klien / Instansi</th>
                  <th>Tgl Terbit</th>
                  <th>Jatuh Tempo</th>
                  <th>Grand Total</th>
                  <th>Terbayar</th>
                  <th>Sisa Tagihan</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500">
                      Memuat data faktur...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-500">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Tidak ada faktur tagihan ditemukan.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="font-bold text-slate-900 font-mono">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-sky-600">
                          {inv.document_number}
                        </Link>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {inv.client_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.client_code} • {inv.client_type}
                        </div>
                      </td>
                      <td className="text-slate-600 whitespace-nowrap">{inv.issue_date}</td>
                      <td className="text-slate-600 whitespace-nowrap">
                        {inv.due_date ? (
                          <span className={inv.status === 'OVERDUE' ? 'text-rose-600 font-semibold' : ''}>
                            {inv.due_date}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="font-semibold text-slate-900 font-mono whitespace-nowrap">
                        {formatRupiah(inv.grand_total)}
                      </td>
                      <td className="text-emerald-700 font-mono whitespace-nowrap">
                        {formatRupiah(inv.paid_amount)}
                      </td>
                      <td className="font-bold text-slate-900 font-mono whitespace-nowrap">
                        {formatRupiah(inv.balance_due)}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/print/invoice/${inv.id}`}
                            target="_blank"
                            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="Cetak A4 / Export PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold hover:bg-sky-100"
                          >
                            <span>Detail</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
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
