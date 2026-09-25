'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  Building2,
  CreditCard,
  Mail,
  Phone,
  Globe,
  MapPin,
  Save,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  QrCode,
  Wifi,
  WifiOff,
  ExternalLink,
  Receipt,
  Info
} from 'lucide-react';
import { DocumentQrCode } from '@/components/DocumentQrCode';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>({
    company_name: 'PT Tekno Wiz Indonesia',
    brand_name: 'TeknoWiz Indonesia',
    slogan: 'Membangun Ekosistem Digital Berkelanjutan',
    address: 'Slawi Kulon, Kec. Slawi',
    city: 'Slawi, Kabupaten Tegal, Jawa Tengah',
    postal_code: '52411',
    email: 'halo@teknowiz.id',
    phone: '+62 878 1127 8630',
    website: 'https://teknowiz.id',
    npwp: '31.849.201.8-501.000',
    nib: '0220109123456',
    bank_name: 'Bank Mandiri',
    bank_account_number: '138-00-2299881-1',
    bank_account_holder: 'PT TEKNO WIZ INDONESIA',
    qr_verification_mode: 'offline',
    public_base_url: 'https://billing.teknowiz.id',
    is_pkp: 0,
    tax_scheme: 'PP55_FINAL',
    suket_pp55_number: '',
    tax_footer_note: 'PT Tekno Wiz Indonesia merupakan entitas PT Perorangan Wajib Pajak Badan Non-PKP (Memanfaatkan tarif PPh Final 0,5% sesuai PP No. 55/2022 jo. PP No. 20/2026).',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadCompany() {
      try {
        setLoading(true);
        const res = await fetch('/api/company');
        if (res.ok) {
          const json = await res.json();
          setProfile({
            ...json,
            qr_verification_mode: json.qr_verification_mode || 'offline',
            public_base_url: json.public_base_url || 'https://billing.teknowiz.id',
            is_pkp: json.is_pkp ? 1 : 0,
            tax_scheme: json.tax_scheme || 'PP55_FINAL',
            suket_pp55_number: json.suket_pp55_number || '',
            tax_footer_note: json.tax_footer_note || 'PT Tekno Wiz Indonesia merupakan entitas PT Perorangan Wajib Pajak Badan Non-PKP (Memanfaatkan tarif PPh Final 0,5% sesuai PP No. 55/2022 jo. PP No. 20/2026).',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memperbarui profil perusahaan');
      }

      setSuccessMsg('Profil legal dan nomor rekening perusahaan berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Pengaturan Identitas Legal & Rekening Perusahaan"
        subtitle="Data yang dimasukkan di sini akan otomatis tercetak di header & footer dokumen resmi"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Shortcut ke Arsip Legalitas */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-600 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-sky-950">
                Arsip Dokumen Legalitas PT (Akta, NIB, NPWP, SK Kemenkumham)
              </h3>
              <p className="text-[11px] text-sky-700">
                Unggah dan kelola berkas scan PDF/gambar resmi untuk lampiran tender B2B/B2G & penagihan.
              </p>
            </div>
          </div>
          <Link
            href="/legality"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-sky-300 text-sky-700 hover:bg-sky-100 font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            <span>Buka Arsip Legalitas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Identitas Legal */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Identitas Badan Usaha PT
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Entitas Legal *</label>
                <input
                  type="text"
                  required
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Brand / Singkatan</label>
                <input
                  type="text"
                  value={profile.brand_name}
                  onChange={(e) => setProfile({ ...profile, brand_name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Slogan Resmi Perusahaan</label>
                <input
                  type="text"
                  value={profile.slogan}
                  onChange={(e) => setProfile({ ...profile, slogan: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nomor NPWP Badan</label>
                <input
                  type="text"
                  value={profile.npwp || ''}
                  onChange={(e) => setProfile({ ...profile, npwp: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nomor Induk Berusaha (NIB)</label>
                <input
                  type="text"
                  value={profile.nib || ''}
                  onChange={(e) => setProfile({ ...profile, nib: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Alamat Kantor</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kota Domisili & Kode Pos</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email Resmi</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">WhatsApp / Telepon Resmi</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Website Resmi</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Rekening Bank Perusahaan */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Rekening Bank Resmi Penampung Tagihan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Bank *</label>
                <input
                  type="text"
                  required
                  value={profile.bank_name}
                  onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nomor Rekening *</label>
                <input
                  type="text"
                  required
                  value={profile.bank_account_number}
                  onChange={(e) =>
                    setProfile({ ...profile, bank_account_number: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Atas Nama Rekening *</label>
                <input
                  type="text"
                  required
                  value={profile.bank_account_holder}
                  onChange={(e) =>
                    setProfile({ ...profile, bank_account_holder: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Kepatuhan Pajak & Status PKP (Perseroan Perorangan) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Kepatuhan Pajak & Status PKP (PT Perorangan)
                </h2>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full self-start sm:self-auto ${
                profile.is_pkp
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {profile.is_pkp ? '🏛️ Status: PKP (Memungut PPN)' : '🛡️ Status: Non-PKP (Bebas PPN UMKM)'}
              </span>
            </div>

            {/* Edukasi Ringkas Regulasi Perpajakan PT Perorangan */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Ketentuan Pokok Transaksi & Perpajakan PT Perorangan (UU Cipta Kerja & PP 20/2026):</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <li>
                  <strong>Subjek Pajak Badan:</strong> PT Perorangan berstatus Wajib Pajak Badan, bukan Orang Pribadi. 
                  <span className="text-rose-600 font-semibold"> Tidak berlaku</span> fasilitas omzet Rp 500 juta bebas pajak (PPh 0,5% dihitung sejak rupiah pertama).
                </li>
                <li>
                  <strong>PPh Final 0,5% (PP 55/2022 jo. PP 20/2026):</strong> Berdasarkan regulasi PP 20/2026, PT Perorangan berhak memanfaatkan PPh Final 0,5% <strong>tanpa batasan masa tahun</strong> selama omzet belum melebihi Rp 4,8 Miliar/tahun.
                </li>
                <li>
                  <strong>Pungutan PPN:</strong> Jika berstatus <em>Non-PKP</em>, perusahaan <strong>dilarang memungut PPN</strong> (tarif 0%). Namun perusahaan berhak mengajukan pengukuhan PKP secara sukarela jika rekanan B2G/B2B mewajibkannya.
                </li>
                <li>
                  <strong>Suket PP 55 / PP 23:</strong> Wajib dilampirkan pada invoice penagihan jasa agar rekanan B2B/B2G <strong>hanya memotong PPh Final 0,5%</strong>, bukan memotong PPh 23 (2%).
                </li>
              </ul>
            </div>

            {/* Pilihan Status PKP */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                Status Pengukuhan Pengusaha Kena Pajak (PKP):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setProfile({ ...profile, is_pkp: 0 })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    !profile.is_pkp
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      !profile.is_pkp ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Non-PKP (Rekomendasi Default)</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">PMK 197/2013</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Omzet di bawah Rp 4,8 Miliar. Faktur tagihan <strong>tidak memungut PPN (0%)</strong>, harga lebih kompetitif bagi klien ritel/UMKM, dan tidak diwajibkan lapor SPT Masa PPN bulanan.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setProfile({ ...profile, is_pkp: 1 })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    profile.is_pkp
                      ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      profile.is_pkp ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Sudah Dikukuhkan PKP</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">e-Faktur Wajib</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Telah mengantongi SPPKP dari KPP Pratama. Wajib memungut PPN (11% atau 12%), menerbitkan Faktur Pajak e-Faktur/Coretax, dan lapor SPT Masa PPN setiap bulan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skema PPh & Nomor Suket PP 55 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Skema PPh Badan yang Diterapkan</label>
                <select
                  value={profile.tax_scheme || 'PP55_FINAL'}
                  onChange={(e) => setProfile({ ...profile, tax_scheme: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                >
                  <option value="PP55_FINAL">PPh Final UMKM 0,5% (PP 55/2022 jo. PP 20/2026)</option>
                  <option value="NORMAL_31E">Tarif Normal Badan - Fasilitas Pasal 31E UU PPh (11% Laba Bersih)</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  {profile.tax_scheme === 'PP55_FINAL'
                    ? 'Tarif 0,5% dari omzet bruto tanpa batasan waktu untuk PT Perorangan.'
                    : 'Tarif 11% dari Penghasilan Kena Pajak (Laba Bersih Fiskal).'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Nomor Surat Keterangan (Suket) PP 55 / PP 23
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KET-12345/WPJ.10/KP.0403/2026"
                  value={profile.suket_pp55_number || ''}
                  onChange={(e) => setProfile({ ...profile, suket_pp55_number: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
                <p className="text-[10px] text-slate-500">
                  Nomor Suket ini akan dicetak pada footer faktur tagihan sebagai dasar pemotongan PPh 0,5% oleh rekanan B2B.
                </p>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">
                  Catatan Kepatuhan Pajak (Tercetak di Footer Faktur)
                </label>
                <textarea
                  rows={2}
                  value={profile.tax_footer_note || ''}
                  onChange={(e) => setProfile({ ...profile, tax_footer_note: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 font-sans"
                />
                <p className="text-[10px] text-slate-500">
                  Klausul resmi ini akan otomatis tampil di setiap lembar cetak faktur tagihan dan surat penawaran.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Aset Visual Resmi (Logo & Stempel) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Aset Visual & Pengesahan Dokumen
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Logo Preview */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="font-bold text-slate-700 uppercase block">
                  Logo Resmi PT (Kop Surat & Web):
                </span>
                <div className="h-20 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="Logo TeknoWiz"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Path: public/images/logo.png
                </p>
              </div>

              {/* Stamp Preview */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="font-bold text-slate-700 uppercase block">
                  Stempel Resmi PT (Faktur, Penawaran, Kwitansi):
                </span>
                <div className="h-20 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center">
                  <img
                    src="/images/stamp-teknowiz.png"
                    alt="Stempel TeknoWiz"
                    className="max-h-16 w-auto object-contain rotate-[-3deg]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Path: public/images/stamp-teknowiz.png
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Mode Verifikasi QR Code Dokumen */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Mode Verifikasi QR Code (Faktur, Penawaran, Kwitansi)
                </h2>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full self-start sm:self-auto ${
                profile.qr_verification_mode === 'online'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-sky-100 text-sky-800 border border-sky-300'
              }`}>
                {profile.qr_verification_mode === 'online' ? '🌐 Mode Online Aktif' : '📱 Mode Offline Aktif'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Tentukan respon sistem saat barcode/QR Code pada dokumen cetak dipindai oleh kamera ponsel pintar (smartphone / Google Lens).
            </p>

            {/* Pilihan 2 Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Mode Offline */}
              <div
                onClick={() => setProfile({ ...profile, qr_verification_mode: 'offline' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  profile.qr_verification_mode === 'offline'
                    ? 'border-sky-600 bg-sky-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg mt-0.5 ${
                    profile.qr_verification_mode === 'offline' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">Mode Offline (Teks Sah Metadata)</span>
                      <span className="text-[10px] bg-sky-200 text-sky-900 font-bold px-1.5 py-0.5 rounded">Default / Mandiri</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      QR Code menyimpan teks sah dokumen secara langsung di dalam barcode. Saat discan oleh kamera HP/Google Lens, ringkasan keabsahan dokumen langsung muncul <strong>tanpa butuh koneksi internet atau server publik</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Mode Online */}
              <div
                onClick={() => setProfile({ ...profile, qr_verification_mode: 'online' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  profile.qr_verification_mode === 'online'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg mt-0.5 ${
                    profile.qr_verification_mode === 'online' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">Mode Online (Tautan Web Publik)</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">Portal Web</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      QR Code mengarahkan pemindai ke halaman web resmi verifikasi publik (<code>/verify?doc=...</code>). Cocok jika aplikasi telah di-deploy ke VPS atau hosting ber-domain publik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Domain Publik (jika mode online) */}
            <div className={`p-4 rounded-xl border transition-all space-y-3 ${
              profile.qr_verification_mode === 'online'
                ? 'bg-slate-50 border-slate-300'
                : 'bg-slate-50/50 border-slate-200 opacity-60'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700">
                  Domain / Base URL Publik Aplikasi:
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Pilihan cepat:</span>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, public_base_url: 'https://billing.teknowiz.id' })}
                    className="text-sky-600 hover:underline font-mono"
                  >
                    billing.teknowiz.id
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, public_base_url: 'http://localhost:3000' })}
                    className="text-sky-600 hover:underline font-mono"
                  >
                    localhost:3000
                  </button>
                </div>
              </div>

              <input
                type="url"
                value={profile.public_base_url || 'https://billing.teknowiz.id'}
                onChange={(e) => setProfile({ ...profile, public_base_url: e.target.value })}
                disabled={profile.qr_verification_mode !== 'online'}
                placeholder="https://billing.teknowiz.id"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-500">
                Format tautan yang dihasilkan: <code className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">{profile.public_base_url || 'https://billing.teknowiz.id'}/verify?doc=KWT/TW/202609/001</code>
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <DocumentQrCode
                  type="RECEIPT"
                  documentNumber="KWT/TW/202609/001"
                  issueDate="2026-09-24"
                  clientName="RSUD Dr. Soeselo Slawi"
                  amount={15000000}
                  signerName="Finance PT Tekno Wiz Indonesia"
                  mode={profile.qr_verification_mode || 'offline'}
                  baseUrl={profile.public_base_url || 'https://billing.teknowiz.id'}
                  size={68}
                />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Live Preview Barcode ({profile.qr_verification_mode === 'online' ? 'Mode Online' : 'Mode Offline'})
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    {profile.qr_verification_mode === 'online'
                      ? 'Scan barcode di samping dengan kamera HP untuk menguji tautan portal verifikasi online.'
                      : 'Scan barcode di samping dengan kamera HP atau Google Lens untuk membaca teks sertifikasi keabsahan dokumen.'}
                  </p>
                </div>
              </div>

              {profile.qr_verification_mode === 'online' && (
                <a
                  href={`/verify?doc=KWT/TW/202609/001`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 font-semibold text-xs shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Uji Buka Portal Verifikasi</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
