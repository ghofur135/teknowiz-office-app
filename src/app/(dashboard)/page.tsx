'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { formatRupiah } from '@/lib/terbilang';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  FileCheck2,
  FileText,
  Users,
  CreditCard,
  Printer,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data?.metrics || {
    totalOmzetBulanIni: 0,
    unpaidTotal: 0,
    unpaidCount: 0,
    cashInflowBulanIni: 0,
    paidInvoices: 0,
    totalInvoices: 0,
    totalQuotations: 0,
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Dashboard Keuangan PT Tekno Wiz Indonesia"
        subtitle="Pusat kontrol operasional faktur, penawaran harga, dan penerimaan kas"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Omzet */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Omzet Bulan Ini</span>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatRupiah(metrics.totalOmzetBulanIni)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total tagihan resmi diterbitkan</p>
          </div>

          {/* Card 2: Tagihan Tertunda */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Piutang Tertunda</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700">
              {formatRupiah(metrics.unpaidTotal)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dari {metrics.unpaidCount || 0} faktur aktif belum lunas
            </p>
          </div>

          {/* Card 3: Kas Masuk */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Kas Masuk (Inflow)</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatRupiah(metrics.cashInflowBulanIni)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Dana diterima bulan berjalan</p>
          </div>

          {/* Card 4: Dokumen Aktif */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Dokumen</span>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{metrics.totalInvoices}</span>
              <span className="text-xs text-slate-500 font-medium">Faktur</span>
              <span className="text-slate-300">|</span>
              <span className="text-2xl font-bold text-slate-900">{metrics.totalQuotations}</span>
              <span className="text-xs text-slate-500 font-medium">Penawaran</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.paidInvoices} faktur telah lunas (Paid)
            </p>
          </div>
        </div>

        {/* Overdue Alerts Section */}
        {data?.overdueAlerts && data.overdueAlerts.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-rose-900 font-semibold mb-3">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm tracking-tight">
                Peringatan: {data.overdueAlerts.length} Faktur Tagihan Telah Melewati Tanggal Jatuh Tempo!
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.overdueAlerts.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-lg border border-rose-200 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{item.document_number}</span>
                      <span className="text-rose-700">{formatRupiah(item.balance_due)}</span>
                    </div>
                    <p className="text-slate-600 font-medium mt-1 truncate">{item.client_name}</p>
                    <p className="text-rose-600 font-medium mt-0.5">Jatuh Tempo: {item.due_date}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/invoices/${item.id}`}
                      className="text-sky-600 font-semibold hover:underline"
                    >
                      Buka Tagihan &rarr;
                    </Link>
                    {item.pic_phone && (
                      <a
                        href={`https://wa.me/${item.pic_phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(item.client_name)},%20kami%20dari%20PT%20Tekno%20Wiz%20Indonesia%20mengingatkan%20faktur%20tagihan%20${encodeURIComponent(item.document_number)}%20sebesar%20${encodeURIComponent(formatRupiah(item.balance_due))}%20telah%20jatuh%20tempo.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                      >
                        Ingatkan via WA
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions & Recent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Documents Table (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Transaksi Dokumen Terbaru</h2>
                <p className="text-xs text-slate-500">6 transaksi penawaran dan faktur terakhir</p>
              </div>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="table-corporate text-xs">
                <thead>
                  <tr>
                    <th>No. Dokumen</th>
                    <th>Tipe</th>
                    <th>Klien</th>
                    <th>Tanggal</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data?.recentDocuments || data.recentDocuments.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        Belum ada dokumen transaksi yang diterbitkan.
                      </td>
                    </tr>
                  ) : (
                    data.recentDocuments.map((doc: any) => (
                      <tr key={doc.id}>
                        <td className="font-semibold text-slate-900 font-mono">
                          {doc.document_number}
                        </td>
                        <td>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            doc.document_type === 'INVOICE'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {doc.document_type === 'INVOICE' ? 'FAKTUR' : 'PENAWARAN'}
                          </span>
                        </td>
                        <td className="font-medium text-slate-800 truncate max-w-[140px]">
                          {doc.client_name}
                        </td>
                        <td className="text-slate-500">{doc.issue_date}</td>
                        <td className="font-semibold text-slate-900 font-mono">
                          {formatRupiah(doc.grand_total)}
                        </td>
                        <td>
                          <StatusBadge status={doc.status} size="sm" />
                        </td>
                        <td className="text-right">
                          <Link
                            href={doc.document_type === 'INVOICE' ? `/invoices/${doc.id}` : `/quotations/${doc.id}`}
                            className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold"
                          >
                            <span>Detail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
              <Link href="/invoices" className="font-semibold text-sky-600 hover:underline">
                Lihat Semua Faktur &rarr;
              </Link>
              <Link href="/quotations" className="font-semibold text-sky-600 hover:underline">
                Lihat Semua Penawaran &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts & Standard Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Aksi Cepat WizBilling
              </h2>
              <div className="space-y-2.5">
                <Link
                  href="/invoices/new"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Buat Faktur Tagihan</div>
                      <div className="text-[11px] text-slate-500">Nomor otomatis INV/TW/...</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
                </Link>

                <Link
                  href="/quotations/new"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Buat Surat Penawaran</div>
                      <div className="text-[11px] text-slate-500">Nomor otomatis QUO/TW/...</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </Link>

                <Link
                  href="/receipts"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Buku Kwitansi Resmi</div>
                      <div className="text-[11px] text-slate-500">Arsip pembayaran & terbilang</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </Link>

                <Link
                  href="/clients"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Kelola Data Klien</div>
                      <div className="text-[11px] text-slate-500">Master B2B / B2G / UMKM</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800" />
                </Link>
              </div>
            </div>

            {/* Standard Legal Information Badge */}
            <div className="bg-slate-900 text-slate-300 rounded-xl p-5 shadow-xs text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white uppercase tracking-wider">Rekening Resmi PT</span>
                <span className="text-[11px] text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  Bank Mandiri
                </span>
              </div>
              <div className="font-mono text-base font-bold text-white tracking-wider">
                138-00-2299881-1
              </div>
              <div className="text-slate-400 text-[11px]">
                a.n. <strong className="text-slate-200">PT TEKNO WIZ INDONESIA</strong>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>NPWP: 31.849.201.8-501.000</span>
                <Link href="/settings" className="text-sky-400 hover:underline">
                  Ubah &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
