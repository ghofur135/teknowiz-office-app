'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/terbilang';
import { calculateDocumentFinancials } from '@/lib/calculator';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Building,
  Calendar,
  CreditCard,
  FileText,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

interface DocumentItemState {
  product_service_id?: number | null;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_amount: number;
  total_price: number;
}

interface DocumentFormProps {
  documentType: 'INVOICE' | 'QUOTATION';
  initialData?: any;
  isEdit?: boolean;
}

export function DocumentForm({
  documentType,
  initialData,
  isEdit = false,
}: DocumentFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);

  const defaultValidDate = new Date();
  defaultValidDate.setDate(defaultValidDate.getDate() + 30);

  const [clientId, setClientId] = useState<number | string>(
    initialData?.client_id || ''
  );
  const [issueDate, setIssueDate] = useState(initialData?.issue_date || today);
  const [dueDate, setDueDate] = useState(
    initialData?.due_date || defaultDueDate.toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    initialData?.valid_until || defaultValidDate.toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialData?.payment_terms || 'Full Payment'
  );
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [referenceNumber, setReferenceNumber] = useState(
    initialData?.reference_number || ''
  );

  // Financial fields
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>(
    initialData?.discount_type || 'FIXED'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.discount_value || 0
  );
  const [taxRate, setTaxRate] = useState<number>(initialData?.tax_rate ?? 0);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(
    initialData?.withholding_tax_rate ?? 0
  );

  const [notes, setNotes] = useState(
    initialData?.notes ||
      (documentType === 'INVOICE'
        ? 'Pembayaran mohon ditransfer tepat waktu sebelum tanggal jatuh tempo. Bukti pembayaran dapat dikonfirmasikan ke Finance PT Tekno Wiz Indonesia.'
        : 'Penawaran harga ini berlaku selama 30 hari kalender sejak tanggal diterbitkan. Harga sudah termasuk implementasi awal dan training personil.')
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialData?.payment_instructions ||
      'Rekening Pembayaran Resmi:\nBank Mandiri KCP Slawi\nNo. Rekening: 138-00-2299881-1\nAtas Nama: PT TEKNO WIZ INDONESIA'
  );
  const [signedBy, setSignedBy] = useState(
    initialData?.signed_by || 'Dhimas Ghofur A. F.'
  );
  const [signerTitle, setSignerTitle] = useState(
    initialData?.signer_title || 'Direktur Utama'
  );

  // Items State
  const [items, setItems] = useState<DocumentItemState[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            item_name: '',
            description: '',
            quantity: 1,
            unit: 'Paket',
            unit_price: 0,
            discount_amount: 0,
            total_price: 0,
          },
        ]
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/products'),
        ]);
        if (cRes.ok) setClients(await cRes.json());
        if (pRes.ok) setProducts(await pRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update item
  const updateItem = (index: number, field: keyof DocumentItemState, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: value };
      const qty = Number(current.quantity) || 0;
      const price = Number(current.unit_price) || 0;
      const disc = Number(current.discount_amount) || 0;
      current.total_price = Math.max(0, qty * price - disc);
      copy[index] = current;
      return copy;
    });
  };

  // Pilih item dari katalog
  const handleSelectProduct = (index: number, productId: string) => {
    if (!productId) return;
    const prod = products.find((p) => String(p.id) === productId);
    if (!prod) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_service_id: prod.id,
        item_name: prod.name,
        description: prod.description || '',
        unit: prod.billing_unit,
        unit_price: prod.default_price,
        total_price:
          (Number(copy[index].quantity) || 1) * prod.default_price -
          (Number(copy[index].discount_amount) || 0),
      };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        item_name: '',
        description: '',
        quantity: 1,
        unit: 'Paket',
        unit_price: 0,
        discount_amount: 0,
        total_price: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Hitung realtime keuangan
  const financials = calculateDocumentFinancials({
    items,
    discount_type: discountType,
    discount_value: discountValue,
    tax_rate: taxRate,
    withholding_tax_rate: withholdingTaxRate,
    paid_amount: initialData?.paid_amount || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Pilih klien terlebih dahulu');
      return;
    }
    if (items.some((i) => !i.item_name.trim())) {
      alert('Nama item barang/layanan tidak boleh kosong');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        document_type: documentType,
        client_id: Number(clientId),
        reference_number: referenceNumber || null,
        issue_date: issueDate,
        due_date: documentType === 'INVOICE' ? dueDate : null,
        valid_until: documentType === 'QUOTATION' ? validUntil : null,
        payment_terms: paymentTerms,
        status,
        discount_type: discountType,
        discount_value: discountValue,
        tax_rate: taxRate,
        withholding_tax_rate: withholdingTaxRate,
        notes,
        payment_instructions: paymentInstructions,
        signed_by: signedBy,
        signer_title: signerTitle,
        items,
      };

      const url = isEdit
        ? `/api/documents/${initialData.id}`
        : '/api/documents';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan dokumen');
      }

      const resData = await res.json();
      const targetId = isEdit ? initialData.id : resData.id;
      const targetPath =
        documentType === 'INVOICE'
          ? `/invoices/${targetId}`
          : `/quotations/${targetId}`;

      router.push(targetPath);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={documentType === 'INVOICE' ? '/invoices' : '/quotations'}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? 'Edit' : 'Buat Baru'}{' '}
              {documentType === 'INVOICE' ? 'Faktur Tagihan' : 'Surat Penawaran'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? initialData?.document_number
                : `Nomor resmi ${documentType === 'INVOICE' ? 'INV' : 'QUO'}/TW/... akan di-generate otomatis`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Menyimpan...' : 'Simpan Dokumen'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Detail Pihak & Dokumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        {/* Klien */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-sky-600" />
            <span>Klien / Instansi Tujuan *</span>
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 focus:bg-white focus:ring-1 focus:ring-sky-500"
          >
            <option value="">-- Pilih Klien --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.client_code} - {c.client_type})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Belum ada klien di daftar?</span>
            <Link href="/clients" target="_blank" className="text-sky-600 font-semibold hover:underline">
              + Tambah Klien
            </Link>
          </div>
        </div>

        {/* Tanggal Terbit */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>Tanggal Terbit *</span>
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 focus:bg-white"
          />
        </div>

        {/* Tanggal Jatuh Tempo / Validitas */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>
              {documentType === 'INVOICE' ? 'Jatuh Tempo (Due Date)' : 'Berlaku Hingga (Valid Until)'}
            </span>
          </label>
          <input
            type="date"
            value={documentType === 'INVOICE' ? dueDate : validUntil}
            onChange={(e) =>
              documentType === 'INVOICE'
                ? setDueDate(e.target.value)
                : setValidUntil(e.target.value)
            }
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 focus:bg-white"
          />
        </div>

        {/* Termin Pembayaran */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-sky-600" />
            <span>Termin Pembayaran</span>
          </label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 focus:bg-white"
          >
            <option value="Full Payment">Full Payment (100%)</option>
            <option value="DP 50%, Pelunasan 50%">DP 50%, Pelunasan 50%</option>
            <option value="DP 30%, Progress 40%, Pelunasan 30%">DP 30%, Progress 40%, Pelunasan 30%</option>
            <option value="Langganan Bulanan (Monthly)">Langganan Bulanan (Monthly)</option>
            <option value="Langganan Tahunan (Annual)">Langganan Tahunan (Annual)</option>
            <option value="Termin 14 Hari (Net 14)">Termin 14 Hari (Net 14)</option>
            <option value="Termin 30 Hari (Net 30)">Termin 30 Hari (Net 30)</option>
          </select>
        </div>

        {/* Referensi Dokumen / PO */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>No. Referensi / PO Klien</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: PO-RSUD/2026/091"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 focus:bg-white"
          />
        </div>

        {/* Status Dokumen */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Status</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 focus:bg-white font-semibold"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">TERKIRIM (SENT)</option>
            {documentType === 'INVOICE' && (
              <>
                <option value="PARTIAL">TERBAYAR SEBAGIAN (PARTIAL)</option>
                <option value="PAID">LUNAS (PAID)</option>
                <option value="OVERDUE">JATUH TEMPO (OVERDUE)</option>
              </>
            )}
            <option value="CANCELLED">DIBATALKAN (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* Section 2: Baris Rincian Item */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Rincian Barang & Layanan
            </h2>
            <p className="text-xs text-slate-500">
              Pilih dari katalog produk atau ketik manual layanan khusus
            </p>
          </div>
          <button
            type="button"
            onClick={addItemRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 min-w-[260px]">Deskripsi Barang / Layanan</th>
                <th className="p-3 w-20">Qty</th>
                <th className="p-3 w-24">Satuan</th>
                <th className="p-3 w-36">Harga Satuan (Rp)</th>
                <th className="p-3 w-28">Diskon Item (Rp)</th>
                <th className="p-3 w-36 text-right">Total (Rp)</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="p-3 space-y-1.5">
                    {/* Katalog Shortcut */}
                    <select
                      onChange={(e) => handleSelectProduct(idx, e.target.value)}
                      className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-600 focus:bg-white mb-1"
                    >
                      <option value="">-- Pilih dari Katalog Produk SaaS / Jasa --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatRupiah(p.default_price)} / {p.billing_unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Nama Layanan / Barang *"
                      value={item.item_name}
                      onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                      required
                      className="w-full text-xs p-1.5 rounded border border-slate-300 font-semibold text-slate-900"
                    />
                    <textarea
                      placeholder="Keterangan tambahan / spesifikasi..."
                      rows={1}
                      value={item.description || ''}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full text-[11px] p-1.5 rounded border border-slate-200 text-slate-600"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      required
                      className="w-full text-xs p-1.5 rounded border border-slate-300 text-center font-mono"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      placeholder="Paket/Bulan"
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-slate-300 text-center"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                      required
                      className="w-full text-xs p-1.5 rounded border border-slate-300 text-right font-mono"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.discount_amount}
                      onChange={(e) => updateItem(idx, 'discount_amount', e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-slate-300 text-right font-mono"
                    />
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 font-mono">
                    {formatRupiah(item.total_price)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length <= 1}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Ringkasan Kalkulasi & Footer Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Kolom Kiri: Catatan & Instruksi Rekening */}
        <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Instruksi Rekening & Pembayaran
            </label>
            <textarea
              rows={4}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono text-slate-800 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Catatan / Syarat & Ketentuan Dokumen
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-800 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Nama Penandatangan
              </label>
              <input
                type="text"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                className="w-full text-xs p-2 rounded border border-slate-300 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Jabatan Penandatangan
              </label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full text-xs p-2 rounded border border-slate-300 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rekapitulasi Finansial */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
            Rekapitulasi Finansial
          </h2>

          <div className="space-y-3 text-xs">
            {/* Subtotal */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 font-medium">Subtotal Layanan:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {formatRupiah(financials.subtotal)}
              </span>
            </div>

            {/* Diskon Global */}
            <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Diskon Tambahan:</span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="text-[11px] p-1 rounded border border-slate-300 bg-slate-50"
                >
                  <option value="FIXED">Nominal (Rp)</option>
                  <option value="PERCENT">Persen (%)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-24 text-right p-1 text-xs rounded border border-slate-300 font-mono"
                />
                <span className="text-slate-700 font-mono">
                  - {formatRupiah(financials.discount_amount)}
                </span>
              </div>
            </div>

            {/* Taxable Amount (DPP) */}
            <div className="flex items-center justify-between py-1 text-slate-500 text-[11px]">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-mono">{formatRupiah(financials.taxable_amount)}</span>
            </div>

            {/* PPN */}
            <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">PPN:</span>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="text-[11px] p-1 rounded border border-slate-300 bg-slate-50"
                >
                  <option value="0">0% (Bebas PPN)</option>
                  <option value="11">11% (PPN Standar)</option>
                  <option value="12">12% (PPN 2025+)</option>
                </select>
              </div>
              <span className="font-mono text-slate-900 font-semibold">
                + {formatRupiah(financials.tax_amount)}
              </span>
            </div>

            {/* PPh 23 Withholding */}
            <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Potongan PPh 23:</span>
                <select
                  value={withholdingTaxRate}
                  onChange={(e) => setWithholdingTaxRate(Number(e.target.value))}
                  className="text-[11px] p-1 rounded border border-slate-300 bg-slate-50"
                >
                  <option value="0">0% (Tidak ada)</option>
                  <option value="2">2% (Jasa IT / Konsultasi)</option>
                </select>
              </div>
              <span className="font-mono text-slate-900 font-semibold">
                - {formatRupiah(financials.withholding_tax_amount)}
              </span>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between py-3 border-t-2 border-slate-900 text-slate-900">
              <span className="text-sm font-bold uppercase tracking-wide">
                Grand Total ({documentType === 'INVOICE' ? 'Tagihan' : 'Penawaran'}):
              </span>
              <span className="text-xl font-bold font-mono text-sky-700">
                {formatRupiah(financials.grand_total)}
              </span>
            </div>

            {isEdit && initialData?.paid_amount > 0 && (
              <>
                <div className="flex items-center justify-between py-1 text-emerald-700">
                  <span className="font-medium">Telah Terbayar:</span>
                  <span className="font-mono font-bold">
                    {formatRupiah(financials.paid_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 text-slate-900 font-bold border-t border-slate-200">
                  <span>Sisa Tagihan (Balance Due):</span>
                  <span className="font-mono text-base">
                    {formatRupiah(financials.balance_due)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
