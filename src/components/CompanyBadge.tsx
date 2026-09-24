'use client';

import React, { useState } from 'react';

interface CompanyBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  logoSrc?: string;
  showText?: boolean;
}

export function CompanyBadge({
  size = 'md',
  logoSrc = '/images/logo.png',
  showText = true,
}: CompanyBadgeProps) {
  const [imageError, setImageError] = useState(false);

  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const imgHeight = isSm ? 'h-8' : isLg ? 'h-14' : 'h-11';
  const boxSize = isSm ? 'w-8 h-8' : isLg ? 'w-14 h-14' : 'w-11 h-11';
  const textSize = isSm ? 'text-xs' : isLg ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center gap-3">
      {/* Tampilkan file logo resmi jika ada */}
      {!imageError ? (
        <img
          src={logoSrc}
          alt="Logo PT Tekno Wiz Indonesia"
          onError={() => setImageError(true)}
          className={`${imgHeight} w-auto max-w-[160px] object-contain shrink-0`}
        />
      ) : (
        /* Fallback Emblem TW jika file logo tidak ada */
        <div
          className={`${boxSize} rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white shadow-xs border border-slate-700 shrink-0 relative overflow-hidden`}
        >
          <span className={`${textSize} tracking-tight font-black text-white`}>TW</span>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-sky-500" />
        </div>
      )}

      {showText && (
        <div>
          <h2 className="font-extrabold text-slate-900 tracking-tight leading-tight text-sm sm:text-base">
            PT TEKNO WIZ INDONESIA
          </h2>
          <p className="text-[11px] text-sky-700 font-medium tracking-tight">
            Membangun Ekosistem Digital Berkelanjutan
          </p>
        </div>
      )}
    </div>
  );
}
