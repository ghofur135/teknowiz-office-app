import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WizBilling - PT Tekno Wiz Indonesia',
  description: 'Sistem Manajemen Faktur Tagihan, Penawaran, & Kwitansi Resmi PT Tekno Wiz Indonesia',
  icons: {
    icon: [
      { url: '/images/favicon.png' },
      { url: '/icon.png' }
    ],
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
        {children}
      </body>
    </html>
  );
}
