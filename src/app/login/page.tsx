'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Building2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Sanitasi Parameter Redirect (Anti Open-Redirect Vulnerability)
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectPath =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes('\\')
      ? rawRedirect
      : '/';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Image states
  const [bannerSrc, setBannerSrc] = useState('/images/login-banner.png');
  const [logoError, setLogoError] = useState(false);

  // Progressive CAPTCHA states
  const [failedCount, setFailedCount] = useState(0);
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 8) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 8) + 1);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Silakan masukkan email dan kata sandi Anda.');
      return;
    }

    // Validasi CAPTCHA jika percobaan gagal >= 2 kali
    if (failedCount >= 2) {
      const expected = captchaNum1 + captchaNum2;
      if (parseInt(captchaInput, 10) !== expected) {
        setErrorMsg('Jawaban verifikasi keamanan (CAPTCHA) salah. Silakan coba lagi.');
        generateCaptcha();
        return;
      }
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFailedCount((prev) => prev + 1);
        generateCaptcha();
        throw new Error(data.error || 'Email atau kata sandi yang Anda masukkan salah.');
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-800">
      {/* SISI KIRI: Visual Showcase dengan login-banner.png */}
      <div className="relative w-full md:w-5/12 lg:w-1/2 bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12 overflow-hidden border-r border-slate-800">
        {/* Banner Image */}
        {bannerSrc && (
          <img
            src={bannerSrc}
            alt="PT Tekno Wiz Indonesia"
            onError={() => {
              if (bannerSrc.endsWith('.png')) {
                setBannerSrc('/images/login-banner.jpg');
              } else {
                setBannerSrc('');
              }
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
          />
        )}

        {/* Elegant Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/75 to-slate-900/60 pointer-events-none" />

        {/* Top Header Sisi Kiri: Logo Resmi PT Tekno Wiz */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {!logoError ? (
              <img
                src="/images/logo.png"
                alt="Logo PT Tekno Wiz Indonesia"
                onError={() => setLogoError(true)}
                className="h-10 w-auto max-w-[150px] object-contain shrink-0 bg-white/10 p-1 rounded-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-sm border border-sky-400/40">
                <span className="text-base font-black tracking-tight">TW</span>
              </div>
            )}
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight leading-tight">
                PT TEKNO WIZ INDONESIA
              </h2>
              <p className="text-xs text-sky-400 font-medium">
                WizBilling • Enterprise Finance & Invoicing
              </p>
            </div>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 my-auto py-12 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-sky-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Sistem Legalitas & Penagihan Resmi</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Membangun Ekosistem Digital Berkelanjutan.
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Pusat kendali penerbitan faktur tagihan B2B/B2G, penawaran harga, dan kwitansi resmi sah untuk seluruh layanan dan lisensi software PT Tekno Wiz Indonesia.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Format Cetak A4 Standar Legal</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Generator Terbilang Otomatis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Verifikasi Keabsahan QR Code</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Pajak Non-PKP PP 55/2022</span>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Slawi, Kabupaten Tegal, Jawa Tengah</span>
          </div>
          <span className="font-mono text-slate-500">{APP_VERSION}</span>
        </div>
      </div>

      {/* SISI KANAN: Form Login */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header Form */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Silakan masukkan kredensial resmi untuk mengakses WizBilling.
              </p>
            </div>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Gagal Masuk:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Email / Username
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@teknowiz.id"
                  className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Kata Sandi
                </label>
                <a
                  href="#contact-admin"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Untuk reset kata sandi, silakan hubungi Administrator IT PT Tekno Wiz Indonesia di halo@teknowiz.id');
                  }}
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Progressive Math CAPTCHA (Tampil saat gagal >= 2 kali) */}
            {failedCount >= 2 && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Verifikasi Keamanan (Anti-Bot)
                  </label>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Acak Soal
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 bg-white rounded border border-amber-300 font-mono font-bold text-sm tracking-wider text-slate-800 select-none">
                    {captchaNum1} + {captchaNum2} = ?
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="Jawaban"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="flex-1 text-xs sm:text-sm px-3 py-2 rounded border border-amber-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Ingat sesi saya di perangkat ini
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-sky-600 text-white font-bold text-xs sm:text-sm hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
            </button>
          </form>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-slate-100 text-center text-xs text-slate-400 space-y-1">
            <p>© 2026 PT Tekno Wiz Indonesia. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="text-[11px]">Sistem Informasi Faktur & Keuangan Korporat</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500 font-medium">
          Memuat halaman login WizBilling...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
