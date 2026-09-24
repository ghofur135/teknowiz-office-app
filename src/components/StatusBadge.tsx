import React from 'react';
import { DocumentStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: DocumentStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const s = status.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = s;

  switch (s) {
    case 'PAID':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      label = 'LUNAS';
      break;
    case 'PARTIAL':
      styles = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      label = 'SEBAGIAN';
      break;
    case 'SENT':
      styles = 'bg-sky-50 text-sky-800 border-sky-300';
      label = 'TERKIRIM';
      break;
    case 'OVERDUE':
      styles = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
      label = 'JATUH TEMPO';
      break;
    case 'CANCELLED':
      styles = 'bg-slate-200 text-slate-600 border-slate-300';
      label = 'DIBATALKAN';
      break;
    case 'DRAFT':
    default:
      styles = 'bg-slate-100 text-slate-700 border-slate-300';
      label = 'DRAFT';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-md border tracking-wide uppercase ${styles} ${sizeClass}`}>
      {label}
    </span>
  );
}
