'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { formatRupiah } from '@/lib/terbilang';
import {
  Calculator,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Printer,
  FileText,
  Building2,
  HelpCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function TaxPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingMonth, setEditingMonth] = useState<any>(null);
  const [formData, setFormData] = useState({
    billing_code: '',
    ntpn_number: '',
    bank_name: 'Bank Mandiri',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'PAID',
    notes: ''
  });

  const fetchTaxData = async (year: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tax?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching tax data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData(selectedYear);
  }, [selectedYear]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenModal = (monthObj: any) => {
    setEditingMonth(monthObj);
    setFormData({
      billing_code: monthObj.billingCode || '',
      ntpn_number: monthObj.ntpnNumber || '',
      bank_name: monthObj.bankName || 'Bank Mandiri',
      payment_date: monthObj.paymentDate || new Date().toISOString().split('T')[0],
      status: monthObj.status === 'PAID' ? 'PAID' : 'PAID',
      notes: monthObj.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonth) return;

    try {
      setModalLoading(true);
      const res = await fetch('/api/tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_year_month: editingMonth.monthKey,
          ...formData
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTaxData(selectedYear);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan data penyetoran pajak.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setModalLoading(false);
    }
  };

  const summary = data?.summary || {
    totalYearTurnover: 0,
    totalYearTaxDue: 0,
    totalPaidTax: 0,
    totalUnpaidTax: 0,
    currentMonthTurnover: 0,
    currentMonthTaxDue: 0,
    currentMonthStatus: 'NO_TRANSACTION',
    currentMonthNtpn: '',
    currentMonthDeadline: '15 Bulan Berikutnya'
  };

  const company = data?.company || {
    company_name: 'PT Tekno Wiz Indonesia',
    npwp: '31.849.201.8-501.000',
    suket_pp55_number: 'KET-01428/WPJ.10/KP.0403/2026'
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Rekapitulasi Pajak PPh Final 0,5% (PP 55)"
        subtitle="Pusat kepatuhan pajak bulanan & pelaporan SPT Tahunan Badan PT Tekno Wiz Indonesia"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Top Header & Year Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                PT Perorangan Non-PKP
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tarif Efektif: <strong className="text-slate-900">0,5% Omzet Bruto</strong> (PP No. 55/2022)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dasar hukum: PP 55/2022 jo. PP 20/2026 • Kode Akun Pajak: <strong>411128</strong> / KJS: <strong>420</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Tahun Pajak:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500 shadow-xs cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2027">2027</option>
            </select>

            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Rekap Tahunan</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Kewajiban Bulan Ini */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Kewajiban Bulan Ini</span>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                <Calculator className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatRupiah(summary.currentMonthTaxDue)}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {summary.currentMonthStatus === 'PAID' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Sudah Disetor (NTPN: {summary.currentMonthNtpn || '-'})
                </span>
              ) : summary.currentMonthTaxDue > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Clock className="w-3 h-3" /> Belum Disetor
                </span>
              ) : (
                <span className="text-xs text-slate-400">Belum ada transaksi</span>
              )}
            </div>
          </div>

          {/* Card 2: Batas Waktu Setor */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Batas Waktu Setor</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 truncate">
              {summary.currentMonthDeadline}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Maksimal tanggal 15 setiap bulannya
            </p>
          </div>

          {/* Card 3: Akumulasi Omzet Tahun Ini */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Omzet Bruto {selectedYear}</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatRupiah(summary.totalYearTurnover)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Dasar pengenaan pajak PPh 0,5%</p>
          </div>

          {/* Card 4: Pajak Disetor */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pajak Disetor {selectedYear}</span>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatRupiah(summary.totalPaidTax)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sisa belum lunas: <strong className="text-amber-600">{formatRupiah(summary.totalUnpaidTax)}</strong>
            </p>
          </div>
        </div>

        {/* Panduan Pembuatan e-Billing DJP Online */}
        <div className="bg-slate-900 text-slate-200 rounded-xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Panduan Pembuatan e-Billing DJP Online (KAP 411128 / KJS 420)
                </h2>
                <p className="text-xs text-slate-400">
                  Gunakan parameter berikut saat membuat kode billing pembayaran di portal DJP Online
                </p>
              </div>
            </div>

            <a
              href="https://djponline.pajak.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
            >
              <span>Buka DJP Online</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* NPWP PT */}
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
              <span className="text-slate-400 block font-medium">NPWP Badan PT:</span>
              <div className="flex items-center justify-between">
                <strong className="text-white font-mono text-sm">{company.npwp}</strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(company.npwp, 'npwp')}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Salin NPWP"
                >
                  {copiedKey === 'npwp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* KAP Code */}
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
              <span className="text-slate-400 block font-medium">Kode Akun Pajak (KAP):</span>
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-sky-400 font-mono text-sm">411128</strong>
                  <span className="text-[11px] text-slate-400 block">PPh Final</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('411128', 'kap')}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Salin KAP"
                >
                  {copiedKey === 'kap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* KJS Code */}
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
              <span className="text-slate-400 block font-medium">Kode Jenis Setoran (KJS):</span>
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-sky-400 font-mono text-sm">420</strong>
                  <span className="text-[11px] text-slate-400 block">PPh Final UMKM PP 55</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('420', 'kjs')}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Salin KJS"
                >
                  {copiedKey === 'kjs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Suket PP 55 */}
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
              <span className="text-slate-400 block font-medium">Nomor Suket PP 55:</span>
              <div className="flex items-center justify-between">
                <strong className="text-slate-200 font-mono text-xs truncate max-w-[150px]">
                  {company.suket_pp55_number}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(company.suket_pp55_number, 'suket')}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Salin Suket"
                >
                  {copiedKey === 'suket' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Rekapitulasi 12 Bulan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Tabel Rekapitulasi Peredaran Bruto & PPh Final 0,5% ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500">
                Data otomatis terakumulasi dari seluruh faktur tagihan resmi yang diterbitkan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Masa Pajak</th>
                  <th className="py-3 px-3 text-center">Jml Faktur</th>
                  <th className="py-3 px-4 text-right">Omzet Bruto (Rp)</th>
                  <th className="py-3 px-3 text-center">Tarif</th>
                  <th className="py-3 px-4 text-right">PPh Final 0,5%</th>
                  <th className="py-3 px-4">No. NTPN / Kode Billing</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      Memuat data rekapitulasi perpajakan...
                    </td>
                  </tr>
                ) : data?.months?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      Belum ada data peredaran bruto untuk tahun {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  data?.months?.map((m: any) => (
                    <tr
                      key={m.monthKey}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        m.isCurrentMonth ? 'bg-sky-50/40 font-semibold' : ''
                      }`}
                    >
                      {/* Masa Pajak */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.monthName}</div>
                        <div className="text-[10px] text-slate-400">Batas: {m.deadline}</div>
                      </td>

                      {/* Jml Faktur */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                          {m.invoiceCount} Faktur
                        </span>
                      </td>

                      {/* Omzet Bruto */}
                      <td className="py-3 px-4 text-right font-mono text-slate-900">
                        {formatRupiah(m.turnover)}
                      </td>

                      {/* Tarif */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {m.taxRate}
                      </td>

                      {/* PPh Final */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-700">
                        {formatRupiah(m.taxAmount)}
                      </td>

                      {/* NTPN / Billing */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {m.ntpnNumber ? (
                          <div>
                            <span className="font-bold text-emerald-700">{m.ntpnNumber}</span>
                            <div className="text-[10px] text-slate-400">
                              {m.bankName || 'Bank Mandiri'} • {m.paymentDate || '-'}
                            </div>
                          </div>
                        ) : m.billingCode ? (
                          <div>
                            <span className="text-sky-700 font-semibold">Billing: {m.billingCode}</span>
                            <div className="text-[10px] text-amber-600">Belum disetor</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {m.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> LUNAS
                          </span>
                        ) : m.taxAmount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" /> BELUM
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                            NIHIL
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center no-print">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 hover:text-sky-900 transition-colors cursor-pointer"
                        >
                          <span>{m.ntpnNumber ? 'Edit NTPN' : 'Input Setor'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900 text-xs">
                  <td className="py-3 px-4" colSpan={2}>
                    TOTAL TAHUNAN ({selectedYear})
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {formatRupiah(summary.totalYearTurnover)}
                  </td>
                  <td className="py-3 px-3 text-center">0,5%</td>
                  <td className="py-3 px-4 text-right font-mono text-sky-800">
                    {formatRupiah(summary.totalYearTaxDue)}
                  </td>
                  <td className="py-3 px-4" colSpan={3}>
                    <span className="text-[11px] text-slate-600 font-normal">
                      Sudah Disetor: <strong className="text-emerald-700">{formatRupiah(summary.totalPaidTax)}</strong> | Belum: <strong className="text-amber-700">{formatRupiah(summary.totalUnpaidTax)}</strong>
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL INPUT SETOR PAJAK (NTPN) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pencatatan Penyetoran Pajak PPh Final
                </h3>
                <p className="text-xs text-slate-500">
                  Masa Pajak: <strong>{editingMonth?.monthName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettlement} className="p-5 space-y-4 text-xs">
              {/* Info Pajak Terutang */}
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex justify-between items-center text-sky-900">
                <div>
                  <span className="text-[11px] block font-medium">Nilai PPh Final 0,5% Terutang:</span>
                  <strong className="text-base font-bold font-mono">
                    {formatRupiah(editingMonth?.taxAmount || 0)}
                  </strong>
                </div>
                <div className="text-right text-[11px]">
                  <span className="block text-sky-700">Omzet Bruto:</span>
                  <strong className="font-mono">{formatRupiah(editingMonth?.turnover || 0)}</strong>
                </div>
              </div>

              {/* Kode Billing */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wide">
                  Kode Billing DJP Online (15 Digit)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 012345678910111"
                  value={formData.billing_code}
                  onChange={(e) => setFormData({ ...formData, billing_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Nomor NTPN */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wide">
                  Nomor NTPN (Bukti Penerimaan Negara)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 82F9A3B21D0E"
                  value={formData.ntpn_number}
                  onChange={(e) => setFormData({ ...formData, ntpn_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-emerald-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Bank & Tanggal Bayar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide">
                    Bank Persepsi
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide">
                    Tanggal Setor
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wide">
                  Status Pembayaran
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="PAID">Lunas / Sudah Disetor (PAID)</option>
                  <option value="UNPAID">Belum Disetor (UNPAID)</option>
                  <option value="EXEMPT">Dikecualikan / Dipotong Pihak Lain</option>
                </select>
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wide">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Opsional: Misal nomor referensi teller / m-banking"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 transition-colors disabled:opacity-50"
                >
                  {modalLoading ? 'Menyimpan...' : 'Simpan Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
