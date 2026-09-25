'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  User,
  DollarSign,
  Search,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/terbilang';
import { OfficialStamp } from '@/components/OfficialStamp';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialDoc = searchParams.get('doc') || '';
  const [docNumber, setDocNumber] = useState(initialDoc);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialDoc) {
      handleVerify(initialDoc);
    }
  }, [initialDoc]);

  const handleVerify = async (queryDoc: string) => {
    if (!queryDoc.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/verify?doc=${encodeURIComponent(queryDoc.trim())}`);
      const data = await res.json();
      if (res.ok && data.found) {
        setResult(data);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 antialiased selection:bg-sky-500 selection:text-white">
      {/* Header Korporat */}
      <div className="w-full max-w-xl text-center space-y-3 mb-6">
        <div className="flex items-center justify-center gap-3">
          <img
            src="/images/logo.png"
            alt="Logo PT Tekno Wiz Indonesia"
            className="h-9 w-auto object-contain brightness-0 invert"
          />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            Portal Verifikasi Dokumen Resmi
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sistem Validasi Keabsahan Dokumen Digital PT Tekno Wiz Indonesia
          </p>
        </div>
      </div>

      {/* Card Utama */}
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search input if wanted to check another doc */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(docNumber);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Masukkan Nomor Dokumen (KWT/..., INV/..., QUO/...)"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Memeriksa...' : 'Cek'}
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-10 space-y-3">
              <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Memverifikasi keabsahan data di arsip server...
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6">
              {/* Badge Terverifikasi */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">
                    Dokumen Resmi Terverifikasi Sah
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Dokumen ini terdaftar secara sah dalam database sistem keuangan resmi PT Tekno Wiz Indonesia.
                  </p>
                </div>
              </div>

              {/* Rincian Dokumen */}
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Nomor Dokumen
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {result.document_number}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Jenis Dokumen
                  </span>
                  <span className="font-semibold text-slate-800">{result.type}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Klien / Instansi
                  </span>
                  <span className="font-bold text-slate-900 text-right">
                    {result.client_name}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Tanggal Dokumen
                  </span>
                  <span className="font-medium text-slate-700">{result.date}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Nominal Dokumen
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(result.amount)}
                  </span>
                </div>

                {result.related_document && (
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-500">Referensi Faktur</span>
                    <span className="font-mono text-slate-700">{result.related_document}</span>
                  </div>
                )}

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500">Penandatangan Sah</span>
                  <span className="font-medium text-slate-800">{result.signer}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500">Status Validasi</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Tanda Stempel Resmi & Legalitas */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-800 uppercase">
                    Penerbit Resmi:
                  </p>
                  <p className="text-xs font-semibold text-slate-700">PT Tekno Wiz Indonesia</p>
                  <p className="text-[10px] text-slate-500">NIB: 0220109123456 • NPWP: 31.849.201.8-501.000</p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Waktu Verifikasi: {new Date(result.verified_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="shrink-0 pl-2">
                  <OfficialStamp size={56} />
                </div>
              </div>
            </div>
          )}

          {!loading && searched && !result && (
            <div className="p-6 text-center space-y-3">
              <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Dokumen Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Nomor dokumen yang Anda cari tidak terdaftar dalam arsip resmi PT Tekno Wiz Indonesia. Pastikan nomor yang dimasukkan sudah sesuai.
              </p>
            </div>
          )}

          {!searched && (
            <div className="p-8 text-center space-y-2 text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">
                Masukkan nomor kwitansi, faktur, atau penawaran pada form di atas untuk memeriksa keabsahan dokumen.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>© 2026 PT Tekno Wiz Indonesia</span>
          <Link href="/login" className="text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1">
            <span>Login Staff</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
          Memuat portal verifikasi...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
