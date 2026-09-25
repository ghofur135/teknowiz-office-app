'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CompanyBadge } from '@/components/CompanyBadge';
import { DocumentQrCode } from '@/components/DocumentQrCode';
import { OfficialStamp } from '@/components/OfficialStamp';
import { formatRupiah } from '@/lib/terbilang';
import { ArrowLeft, Printer } from 'lucide-react';

export default function PrintQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/documents/${id}`);
        if (res.ok) {
          setDocument(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading || !document) {
    return <div className="p-8 text-center text-slate-500">Memuat penawaran harga...</div>;
  }

  const comp = document.company || {
    company_name: 'PT Tekno Wiz Indonesia',
    slogan: 'Membangun Ekosistem Digital Berkelanjutan',
    address: 'Slawi Kulon, Kec. Slawi',
    city: 'Slawi, Kabupaten Tegal, Jawa Tengah 52411',
    email: 'halo@teknowiz.id',
    phone: '+62 878 1127 8630',
    website: 'https://teknowiz.id',
    npwp: '31.849.201.8-501.000',
    nib: '0220109123456',
  };

  return (
    <div className="min-h-screen bg-slate-200/70 py-6 sm:py-10 print:py-0 print:bg-white text-slate-800">
      {/* Print Controls */}
      <div className="no-print max-w-4xl mx-auto mb-6 px-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">
            Ukuran Cetak: Standar A4 (1 Lembar)
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Surat Penawaran (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="print-page w-full max-w-[210mm] mx-auto bg-white p-[10mm_12mm] sm:shadow-lg sm:border sm:border-slate-300 text-[11px] leading-relaxed flex flex-col justify-between print:shadow-none print:border-none">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <CompanyBadge size="md" />
              <div className="text-[10px] text-slate-600 mt-2 space-y-0.5 leading-tight">
                <p>{comp.address}, {comp.city}</p>
                <p>Email: {comp.email} • WA: {comp.phone}</p>
                <p>Website: {comp.website} • NPWP: {comp.npwp}</p>
                <p className="font-semibold text-slate-700">
                  Status: PT Perorangan • {comp.is_pkp ? 'Pengusaha Kena Pajak (PKP)' : 'Non-PKP (Bebas PPN UMKM)'}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                SURAT PENAWARAN HARGA
              </h1>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                OFFICIAL QUOTATION
              </p>
              <div className="text-sm font-mono font-extrabold text-slate-900 mt-2 px-2.5 py-1 bg-slate-100 rounded border border-slate-300">
                {document.document_number}
              </div>
              <div className="mt-2 text-[10px] font-semibold text-slate-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Masa Berlaku: {document.valid_until || '30 Hari Kalender'}
              </div>
            </div>
          </div>

          {/* Client & Metadata */}
          <div className="grid grid-cols-2 gap-6 my-4 py-2 border-b border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Ditujukan Kepada Calon Mitra:
              </span>
              <h3 className="font-extrabold text-slate-900 text-xs">
                {document.client_name}
              </h3>
              {document.pic_name && (
                <p className="text-slate-700">
                  <span className="text-slate-500">U.p.:</span> <strong>{document.pic_name}</strong>
                </p>
              )}
              {document.client_address && (
                <p className="text-slate-600 text-[10px] leading-tight max-w-xs">
                  {document.client_address}
                </p>
              )}
              {document.pic_phone && (
                <p className="text-slate-600 text-[10px]">Telp/WA: {document.pic_phone}</p>
              )}
            </div>

            <div className="space-y-1.5 text-right flex flex-col justify-start items-end">
              <div className="flex justify-between w-full max-w-[240px] text-[11px]">
                <span className="text-slate-500">Tanggal Penawaran:</span>
                <span className="font-bold text-slate-900">{document.issue_date}</span>
              </div>
              <div className="flex justify-between w-full max-w-[240px] text-[11px]">
                <span className="text-slate-500">Masa Berlaku:</span>
                <span className="font-bold text-slate-900">{document.valid_until || '30 Hari'}</span>
              </div>
              <div className="flex justify-between w-full max-w-[240px] text-[11px]">
                <span className="text-slate-500">Skema Termin:</span>
                <span className="font-semibold text-slate-800">{document.payment_terms}</span>
              </div>
              {document.reference_number && (
                <div className="flex justify-between w-full max-w-[240px] text-[11px]">
                  <span className="text-slate-500">No. Ref:</span>
                  <span className="font-mono font-semibold text-slate-800">{document.reference_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Table Items */}
          <div className="my-3">
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-2 w-8 text-center border border-slate-900">NO</th>
                  <th className="p-2 text-left border border-slate-900">DESKRIPSI PAKET LAYANAN</th>
                  <th className="p-2 w-12 text-center border border-slate-900">QTY</th>
                  <th className="p-2 w-16 text-center border border-slate-900">SATUAN</th>
                  <th className="p-2 w-28 text-right border border-slate-900">HARGA (RP)</th>
                  <th className="p-2 w-24 text-right border border-slate-900">DISKON</th>
                  <th className="p-2 w-28 text-right border border-slate-900">TOTAL (RP)</th>
                </tr>
              </thead>
              <tbody>
                {document.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 text-center text-slate-500 font-semibold border-x border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{item.item_name}</div>
                      {item.description && (
                        <div className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-center font-mono border-r border-slate-200">
                      {item.quantity}
                    </td>
                    <td className="p-2 text-center text-slate-600 border-r border-slate-200">
                      {item.unit}
                    </td>
                    <td className="p-2 text-right font-mono border-r border-slate-200">
                      {formatRupiah(item.unit_price, false)}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500 border-r border-slate-200">
                      {item.discount_amount > 0 ? formatRupiah(item.discount_amount, false) : '-'}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                      {formatRupiah(item.total_price, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer & Dual Signature */}
        <div className="mt-4 pt-2 border-t-2 border-slate-900">
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-7 space-y-2">
              <div className="text-[10px] text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-bold text-slate-900 uppercase block mb-1">
                  Syarat & Ketentuan Penawaran:
                </span>
                <p>1. Penawaran harga bersifat mengikat selama masa berlaku dokumen.</p>
                <p>2. Pekerjaan/implementasi dimulai setelah penandatanganan SPK / PO / Kontrak resmi.</p>
                <p>3. {document.notes || 'Biaya sudah termasuk setup cloud dan pelatihan awal pengguna.'}</p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <DocumentQrCode
                  type="QUOTATION"
                  documentNumber={document.document_number}
                  issueDate={document.issue_date}
                  clientName={document.client_name}
                  amount={document.grand_total}
                  signerName={document.signed_by || 'Dhimas Ghofur A. F.'}
                  mode={comp.qr_verification_mode || 'offline'}
                  baseUrl={comp.public_base_url || 'https://billing.teknowiz.id'}
                  size={54}
                />
                <div className="text-[9px] text-slate-500 leading-tight">
                  <p className="font-bold text-slate-700">DOKUMEN RESMI PT TEKNO WIZ INDONESIA</p>
                  <p>Keabsahan penawaran ini dapat diverifikasi melalui sistem WizBilling.</p>
                </div>
              </div>
            </div>

            <div className="col-span-5 space-y-2">
              <div className="space-y-1 text-[10.5px]">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-mono font-semibold">{formatRupiah(document.subtotal)}</span>
                </div>
                {document.discount_amount > 0 && (
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>Diskon:</span>
                    <span className="font-mono">- {formatRupiah(document.discount_amount)}</span>
                  </div>
                )}
                {document.tax_amount > 0 ? (
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>PPN ({document.tax_rate}%):</span>
                    <span className="font-mono">+ {formatRupiah(document.tax_amount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between py-0.5 text-slate-500">
                    <span>PPN (0% Non-PKP):</span>
                    <span className="font-mono">Rp 0</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-t-2 border-slate-900 font-black text-xs text-slate-900">
                  <span className="uppercase">Grand Total:</span>
                  <span className="font-mono text-sm text-indigo-800">{formatRupiah(document.grand_total)}</span>
                </div>
              </div>

              {/* Dual Signatures */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-center">
                <div>
                  <p className="text-[9px] text-slate-500 font-medium">Disetujui Oleh Klien,</p>
                  <div className="h-14 flex items-end justify-center">
                    <div className="w-20 border-b border-slate-400" />
                  </div>
                  <p className="text-[9px] font-bold text-slate-800 mt-1">
                    ( .................................... )
                  </p>
                  <p className="text-[8px] text-slate-400">Tanda Tangan & Cap Instansi</p>
                </div>

                <div>
                  <p className="text-[9px] text-slate-500 font-medium">PT Tekno Wiz Indonesia,</p>
                  <div className="h-14 flex items-center justify-center">
                    <OfficialStamp size={58} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-900 underline mt-1">
                    {document.signed_by || 'Dhimas Ghofur A. F.'}
                  </p>
                  <p className="text-[8px] text-slate-500">{document.signer_title || 'Direktur Utama'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
