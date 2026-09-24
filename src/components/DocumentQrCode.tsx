'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface DocumentQrCodeProps {
  text?: string;
  type?: 'INVOICE' | 'QUOTATION' | 'RECEIPT' | string;
  documentNumber?: string;
  issueDate?: string;
  clientName?: string;
  amount?: number | string;
  signerName?: string;
  mode?: 'offline' | 'online';
  baseUrl?: string;
  size?: number;
  showCaption?: boolean;
  className?: string;
}

export function DocumentQrCode({
  text,
  type = 'INVOICE',
  documentNumber,
  issueDate,
  clientName,
  amount,
  signerName,
  mode = 'offline',
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://billing.teknowiz.id',
  size = 70,
  showCaption = true,
  className = '',
}: DocumentQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  const targetDocNumber = documentNumber || text || 'DOC/TW/2026/000';

  useEffect(() => {
    let payload = '';

    if (mode === 'online') {
      const cleanBase = (baseUrl || 'https://billing.teknowiz.id').replace(/\/+$/, '');
      payload = `${cleanBase}/verify?doc=${encodeURIComponent(targetDocNumber)}`;
    } else {
      let docTitle = 'Dokumen Transaksi';
      const upperType = String(type).toUpperCase();
      if (upperType === 'INVOICE' || targetDocNumber.startsWith('INV')) {
        docTitle = 'Faktur Tagihan (Invoice)';
      } else if (upperType === 'QUOTATION' || targetDocNumber.startsWith('QUO')) {
        docTitle = 'Surat Penawaran Harga (Quotation)';
      } else if (upperType === 'RECEIPT' || targetDocNumber.startsWith('KWT')) {
        docTitle = 'Kwitansi Pembayaran Resmi (Receipt)';
      }

      const formattedAmount =
        typeof amount === 'number'
          ? `Rp ${amount.toLocaleString('id-ID')}`
          : amount || '';

      const lines = [
        'DOKUMEN RESMI PT TEKNO WIZ INDONESIA',
        `Jenis: ${docTitle}`,
        `Nomor: ${targetDocNumber}`,
        issueDate ? `Tanggal: ${issueDate}` : '',
        clientName ? `Klien: ${clientName}` : '',
        formattedAmount ? `Nominal: ${formattedAmount}` : '',
        signerName ? `Penandatangan: ${signerName}` : '',
        'Status: SAH & TERCATAT'
      ].filter(Boolean);

      payload = lines.join('\n');
    }

    QRCode.toDataURL(payload, {
      margin: 1,
      width: Math.max(size * 2, 120),
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [mode, baseUrl, targetDocNumber, type, issueDate, clientName, amount, signerName, size]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="border border-slate-300 p-1 bg-white rounded flex items-center justify-center overflow-hidden shrink-0 shadow-xs"
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Keabsahan ${targetDocNumber}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
        )}
      </div>
      {showCaption && (
        <span className="text-[8px] font-mono text-slate-500 uppercase mt-1 tracking-tight text-center whitespace-nowrap">
          {mode === 'online' ? 'Scan Verifikasi Web' : 'Verifikasi Resmi'}
        </span>
      )}
    </div>
  );
}
