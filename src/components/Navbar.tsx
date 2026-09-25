'use client';

import React from 'react';
import Link from 'next/link';
import { useSidebar } from '@/context/SidebarContext';
import { Plus, FileCheck2, Calendar, Menu } from 'lucide-react';

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

export function Navbar({ title = 'Dashboard Keuangan', subtitle }: NavbarProps) {
  const { toggle } = useSidebar();

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="no-print bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Hamburger Toggle + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={toggle}
            aria-label="Buka menu navigasi"
            className="md:hidden p-2 -ml-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick Action Buttons & Date */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentDate}</span>
          </div>

          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="hidden sm:inline">Buat Penawaran</span>
            <span className="sm:hidden text-[11px]">Penawaran</span>
          </Link>

          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Buat Faktur Tagihan</span>
            <span className="sm:hidden text-[11px]">Faktur</span>
          </Link>
        </div>
      </div>

      {/* Subtitle on mobile */}
      {subtitle && (
        <p className="text-[11px] text-slate-500 mt-1 truncate sm:hidden">
          {subtitle}
        </p>
      )}
    </header>
  );
}
