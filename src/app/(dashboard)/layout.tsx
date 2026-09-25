import React from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div suppressHydrationWarning className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
