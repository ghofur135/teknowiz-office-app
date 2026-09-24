'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { formatRupiah } from '@/lib/terbilang';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  X,
  Server,
  Code2,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Copy,
  Check,
  FileCheck2
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Preview Modal State
  const [previewProduct, setPreviewProduct] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'SAAS',
    description: '',
    default_price: 0,
    billing_unit: 'Bulan',
  });
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      code: `TW-PROD-${String(products.length + 1).padStart(2, '0')}`,
      name: '',
      category: 'SAAS',
      description: '',
      default_price: 500000,
      billing_unit: 'Bulan',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setFormData({
      code: prod.code,
      name: prod.name,
      category: prod.category,
      description: prod.description || '',
      default_price: prod.default_price,
      billing_unit: prod.billing_unit,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan produk');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Nonaktifkan produk "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus produk');
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopySpecs = (p: any) => {
    const text = [
      `*PRODUK & LAYANAN TEKNOWIZ*`,
      `Nama: ${p.name}`,
      `Kode: ${p.code}`,
      `Kategori: ${p.category}`,
      `Tarif Standar: ${formatRupiah(p.default_price)} / ${p.billing_unit}`,
      p.description ? `Deskripsi:\n${p.description}` : '',
      `\nPT Tekno Wiz Indonesia • https://teknowiz.id`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = products.filter((p) => {
    const matchCategory =
      categoryFilter === 'ALL' || p.category === categoryFilter;
    if (!matchCategory) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Katalog Produk SaaS & Jasa Solusi IT"
        subtitle="Daftar paket resmi TeknoWiz (PulseTV, Wizly, InfraMate, Jasa Konsultasi)"
      />

      <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            {['ALL', 'SAAS', 'IT_SERVICE', 'LICENSE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari produk / kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 sm:w-64 pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 text-center py-10 text-slate-500">
              Memuat katalog produk...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Tidak ada produk ditemukan.
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {p.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.category === 'SAAS'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {p.category}
                    </span>
                  </div>

                  <h3
                    onClick={() => setPreviewProduct(p)}
                    className="font-bold text-sm text-slate-900 leading-snug cursor-pointer hover:text-sky-600 transition-colors"
                    title="Klik untuk melihat pratinjau lengkap"
                  >
                    {p.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {p.description || 'Tidak ada deskripsi'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500">Tarif Standar:</span>
                    <div className="font-bold text-sm text-slate-900 font-mono">
                      {formatRupiah(p.default_price)}{' '}
                      <span className="text-[11px] text-slate-500 font-normal">
                        / {p.billing_unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewProduct(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                      title="Lihat Pratinjau Lengkap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct ? 'Edit Katalog Produk' : 'Tambah Produk / Layanan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Kode Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-semibold"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="SAAS">SaaS / Cloud Subscription</option>
                    <option value="IT_SERVICE">Jasa Konsultasi & IT Service</option>
                    <option value="LICENSE">Lisensi On-Premise</option>
                    <option value="HARDWARE">Hardware / Perangkat</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Nama Produk / Layanan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PulseTV Control - Cloud Signage"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Tarif Standar (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formData.default_price}
                    onChange={(e) =>
                      setFormData({ ...formData, default_price: Number(e.target.value) })
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Satuan Penagihan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bulan / Tahun / Paket / Layar"
                    value={formData.billing_unit}
                    onChange={(e) => setFormData({ ...formData, billing_unit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Deskripsi & Spesifikasi Layanan
                </label>
                <textarea
                  rows={3}
                  placeholder="Rincian fitur atau ruang lingkup layanan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Produk */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pratinjau Rincian Produk & Layanan
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    PT Tekno Wiz Indonesia • {previewProduct.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Product Title & Badges */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                    {previewProduct.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      previewProduct.category === 'SAAS'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : previewProduct.category === 'IT_SERVICE'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {previewProduct.category === 'SAAS'
                      ? 'SaaS / Cloud Subscription'
                      : previewProduct.category === 'IT_SERVICE'
                      ? 'Jasa Solusi & Konsultasi IT'
                      : previewProduct.category}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    Katalog Aktif
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {previewProduct.name}
                </h2>
              </div>

              {/* Pricing Highlight Card */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                    Tarif Katalog Standar (Sebelum Pajak):
                  </span>
                  <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                    {formatRupiah(previewProduct.default_price)}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">
                      / {previewProduct.billing_unit}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 space-y-0.5">
                  <p className="text-slate-400">Estimasi + PPN 11%:</p>
                  <p className="font-mono font-bold text-sky-300">
                    {formatRupiah(Math.round(previewProduct.default_price * 1.11))}
                  </p>
                </div>
              </div>

              {/* Deskripsi & Ruang Lingkup Layanan */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Deskripsi & Ruang Lingkup Layanan
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line text-xs">
                  {previewProduct.description || 'Belum ada rincian teknis khusus yang dimasukkan untuk produk ini.'}
                </div>
              </div>

              {/* Standar Legal & Dukungan Layanan TeknoWiz */}
              <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 space-y-1.5 text-[11px] text-slate-600">
                <p className="font-bold text-sky-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Standar Mutu & Dukungan Layanan TeknoWiz:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>Layanan resmi terikat kontrak kerjasama atau Surat Pesanan Kerja (SPK).</li>
                  <li>Dukungan teknis berkala dan garansi implementasi sesuai SLA resmi.</li>
                  <li>Faktur tagihan & kwitansi sah dapat langsung diterbitkan dari sistem WizBilling.</li>
                </ul>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySpecs(previewProduct)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin Spesifikasi</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prod = previewProduct;
                    setPreviewProduct(null);
                    openEditModal(prod);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>

                <Link
                  href="/quotations/new"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors shadow-xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Buat Penawaran</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
