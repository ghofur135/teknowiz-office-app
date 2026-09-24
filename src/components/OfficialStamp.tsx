'use client';

import React, { useState } from 'react';

interface OfficialStampProps {
  src?: string;
  size?: number;
  className?: string;
}

export function OfficialStamp({
  src = '/images/stamp-teknowiz.png',
  size = 72,
  className = '',
}: OfficialStampProps) {
  const [stampError, setStampError] = useState(false);

  if (!stampError && src) {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <img
          src={src}
          alt="Stempel Resmi PT Tekno Wiz Indonesia"
          onError={() => setStampError(true)}
          style={{ width: size, height: size }}
          className="object-contain rotate-[-4deg] opacity-95 filter drop-shadow-xs transition-transform mix-blend-multiply"
        />
      </div>
    );
  }

  // Fallback stempel jika file belum ditemukan
  return (
    <div
      style={{ width: size + 16, height: size - 14 }}
      className={`rounded border border-dashed border-sky-500/70 flex items-center justify-center text-[9px] font-bold text-sky-800 uppercase tracking-wider rotate-[-4deg] ${className}`}
    >
      [ STEMPEL PT ]
    </div>
  );
}
