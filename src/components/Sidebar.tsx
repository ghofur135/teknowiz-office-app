'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileCheck2,
  Receipt,
  Users,
  Package,
  Settings,
  ShieldCheck,
  Building2,
  LogOut,
  UserCheck
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Faktur Tagihan', href: '/invoices', icon: FileText },
  { name: 'Surat Penawaran', href: '/quotations', icon: FileCheck2 },
  { name: 'Buku Kwitansi', href: '/receipts', icon: Receipt },
  { name: 'Master Klien', href: '/clients', icon: Users },
  { name: 'Katalog Layanan', href: '/products', icon: Package },
  { name: 'Legalitas PT', href: '/legality', icon: ShieldCheck },
  { name: 'Pengaturan PT', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
      router.push('/login');
    }
  };

  return (
    <aside suppressHydrationWarning className="no-print w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Logo TeknoWiz"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
            className="w-10 h-10 object-contain rounded-lg shrink-0 bg-white/10 p-1 border border-slate-700/60"
          />
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">
              TeknoWiz
            </h1>
            <p className="text-xs text-sky-400 font-medium">Billing & Invoicing</p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
          <Building2 className="w-3 h-3 text-sky-400" />
          <span>PT Tekno Wiz Indonesia</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logged in User & Logout Action */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-sky-600/80 text-white flex items-center justify-center font-bold text-xs shrink-0">
              D
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Dhimas Ghofur</p>
              <p className="text-[10px] text-slate-400 truncate">dhimas@teknowiz.id</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-2 text-[10px] text-slate-500">
          <span>Slawi, Tegal (Jateng)</span>
          <span className="text-sky-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
