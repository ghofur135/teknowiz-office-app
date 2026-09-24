'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, FileText, FileCheck2, Calendar } from 'lucide-react';

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

export function Navbar({ title = 'Dashboard Keuangan', subtitle }: NavbarProps) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="no-print bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentDate}</span>
        </div>

        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
          <span>Buat Penawaran</span>
        </Link>

        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Faktur Tagihan</span>
        </Link>
      </div>
    </header>
  );
}
