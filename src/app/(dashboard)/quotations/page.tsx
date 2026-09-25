'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRupiah } from '@/lib/terbilang';
import {
  FileCheck2,
  Plus,
  Search,
  Printer,
  ChevronRight,
  ArrowRightCircle,
  Clock
} from 'lucide-react';

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      let url = `/api/documents?type=QUOTATION`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setQuotations(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotations();
  };

  const handleConvert = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin mengonversi penawaran ini menjadi Faktur Tagihan (Invoice)?')) {
      return;
    }

    try {
      setConvertingId(id);
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
      setConvertingId(null);
    }
  };

  const tabs = [
    { key: 'ALL', label: 'Semua' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'SENT', label: 'Terkirim' },
    { key: 'CANCELLED', label: 'Dibatalkan' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Surat Penawaran Harga (Quotations)"
        subtitle="Kelola dan konversi penawaran harga resmi PT Tekno Wiz Indonesia"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 flex-1 overflow-y-auto">
        {/* Header Bar */}
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
                placeholder="Cari penawaran / klien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </form>

            <Link
              href="/quotations/new"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Penawaran Baru</span>
            </Link>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-corporate text-xs">
              <thead>
                <tr>
                  <th>No. Penawaran</th>
                  <th>Klien / Instansi</th>
                  <th>Tgl Terbit</th>
                  <th>Masa Berlaku</th>
                  <th>Grand Total</th>
                  <th>Termin</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      Memuat data penawaran...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      <FileCheck2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Belum ada surat penawaran harga.
                    </td>
                  </tr>
                ) : (
                  quotations.map((quo) => (
                    <tr key={quo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="font-bold text-slate-900 font-mono">
                        <Link href={`/quotations/${quo.id}`} className="hover:text-sky-600">
                          {quo.document_number}
                        </Link>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {quo.client_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {quo.client_code} • {quo.client_type}
                        </div>
                      </td>
                      <td className="text-slate-600 whitespace-nowrap">{quo.issue_date}</td>
                      <td className="text-slate-600 whitespace-nowrap">
                        {quo.valid_until || '30 Hari'}
                      </td>
                      <td className="font-semibold text-slate-900 font-mono whitespace-nowrap">
                        {formatRupiah(quo.grand_total)}
                      </td>
                      <td className="text-slate-600 truncate max-w-[120px]">
                        {quo.payment_terms}
                      </td>
                      <td>
                        <StatusBadge status={quo.status} size="sm" />
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleConvert(quo.id)}
                            disabled={convertingId === quo.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold hover:bg-indigo-100 disabled:opacity-50"
                            title="Konversi ke Faktur Tagihan"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                            <span>Convert to Invoice</span>
                          </button>
                          <Link
                            href={`/print/quotation/${quo.id}`}
                            target="_blank"
                            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="Cetak A4 / Export PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/quotations/${quo.id}`}
                            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Detail Penawaran"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
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
