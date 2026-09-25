'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  Users,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  X,
  Check,
  Eye,
  Copy,
  MessageSquare,
  FileCheck2,
  FileText,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Preview Modal State
  const [previewClient, setPreviewClient] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    client_type: 'B2B',
    pic_name: '',
    pic_phone: '',
    pic_email: '',
    address: '',
    tax_number: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      if (res.ok) {
        setClients(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      client_type: 'B2B',
      pic_name: '',
      pic_phone: '',
      pic_email: '',
      address: '',
      tax_number: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      client_type: client.client_type,
      pic_name: client.pic_name || '',
      pic_phone: client.pic_phone,
      pic_email: client.pic_email || '',
      address: client.address || '',
      tax_number: client.tax_number || '',
      notes: client.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan klien');
      }

      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus data klien "${name}"?`)) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus klien');
      }
      fetchClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyClient = (c: any) => {
    const text = [
      `*PROFIL KLIEN PT TEKNO WIZ INDONESIA*`,
      `Instansi: ${c.name}`,
      `Kode Klien: ${c.client_code} (${c.client_type})`,
      c.pic_name ? `PIC: ${c.pic_name}` : '',
      `WhatsApp: ${c.pic_phone}`,
      c.pic_email ? `Email: ${c.pic_email}` : '',
      c.tax_number ? `NPWP: ${c.tax_number}` : '',
      c.address ? `Alamat: ${c.address}` : '',
      c.notes ? `Catatan: ${c.notes}` : '',
      `\nSistem WizBilling • https://teknowiz.id`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.client_code.toLowerCase().includes(q) ||
      c.pic_name?.toLowerCase().includes(q) ||
      c.pic_phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        title="Master Data Klien & Mitra (Mini-CRM)"
        subtitle="Kelola profil instansi B2B, B2G pemerintah, korporasi, dan UMKM"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Cari nama instansi / PIC / kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Klien Baru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 text-center py-10 text-slate-500">
              Memuat data klien...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Tidak ada data klien yang ditemukan.
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {c.client_code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.client_type}
                    </span>
                  </div>

                  <h3
                    onClick={() => setPreviewClient(c)}
                    className="font-bold text-sm text-slate-900 leading-snug cursor-pointer hover:text-sky-600 transition-colors"
                    title="Klik untuk melihat pratinjau lengkap"
                  >
                    {c.name}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    {c.pic_name && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{c.pic_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.pic_phone}</span>
                    </div>
                    {c.pic_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.pic_email}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-start gap-2 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-500 leading-relaxed">
                          {c.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {c.tax_number ? `NPWP: ${c.tax_number}` : 'Tanpa NPWP'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewClient(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                      title="Lihat Pratinjau Lengkap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                      title="Edit Klien"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Klien"
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
                {editingClient ? 'Edit Data Klien' : 'Tambah Klien Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Nama Klien / Instansi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RSUD Dr. Soeselo Slawi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Tipe Klien
                  </label>
                  <select
                    value={formData.client_type}
                    onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="B2B">B2B Korporat</option>
                    <option value="B2G">B2G Pemda / RS</option>
                    <option value="UMKM">UMKM</option>
                    <option value="B2C">Personal / B2C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Nama PIC / Pejabat
                  </label>
                  <input
                    type="text"
                    placeholder="Nama PIC proyek"
                    value={formData.pic_name}
                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    No. WhatsApp PIC *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+62 812..."
                    value={formData.pic_phone}
                    onChange={(e) => setFormData({ ...formData, pic_phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    Email PIC / Kantor
                  </label>
                  <input
                    type="email"
                    placeholder="kontak@instansi.com"
                    value={formData.pic_email}
                    onChange={(e) => setFormData({ ...formData, pic_email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">
                    NPWP Klien (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000.0-000.000"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Alamat Lengkap Klien
                </label>
                <textarea
                  rows={2}
                  placeholder="Jalan, kelurahan, kecamatan, kota/kabupaten..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Catatan Khusus
                </label>
                <input
                  type="text"
                  placeholder="Catatan penagihan atau riwayat pengadaan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
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
                  {saving ? 'Menyimpan...' : 'Simpan Data Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Klien */}
      {previewClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Building className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Profil Instansi & Mitra Klien
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    PT Tekno Wiz Indonesia • {previewClient.client_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewClient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Client Title & Badges */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                    {previewClient.client_code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      previewClient.client_type === 'B2G'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : previewClient.client_type === 'B2B'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {previewClient.client_type === 'B2G'
                      ? 'B2G (Pemerintah / RSUD / Dinas)'
                      : previewClient.client_type === 'B2B'
                      ? 'B2B Korporat & Swasta'
                      : previewClient.client_type}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    Klien Aktif
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {previewClient.name}
                </h2>
              </div>

              {/* PIC & Direct Contact Card */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-sm">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Penanggung Jawab (PIC) & Kontak Langsung:
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-sky-400" />
                      {previewClient.pic_name || 'Tidak ada nama PIC terdaftar'}
                    </p>
                    <p className="text-xs font-mono text-slate-300">
                      {previewClient.pic_phone}
                    </p>
                    {previewClient.pic_email && (
                      <p className="text-[11px] text-slate-400">
                        {previewClient.pic_email}
                      </p>
                    )}
                  </div>

                  {previewClient.pic_phone && (
                    <a
                      href={`https://wa.me/${previewClient.pic_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs self-start sm:self-auto transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Data Legalitas, Pajak & Alamat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    NPWP Klien:
                  </span>
                  <p className="font-mono font-bold text-slate-800 text-xs">
                    {previewClient.tax_number || 'Tidak Ada (Non-PKP / Pribadi)'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Tipe Kemitraan:
                  </span>
                  <p className="font-bold text-slate-800 text-xs">
                    {previewClient.client_type} (Terdaftar di Database PT)
                  </p>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Alamat Kantor / Penagihan:
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed text-xs">
                  {previewClient.address || 'Belum ada alamat kantor yang dicantumkan.'}
                </div>
              </div>

              {/* Catatan Khusus */}
              {previewClient.notes && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Catatan Kebutuhan / Pengadaan:
                  </h4>
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 leading-relaxed text-xs">
                    {previewClient.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyClient(previewClient)}
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
                      <span>Salin Kontak</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const client = previewClient;
                    setPreviewClient(null);
                    openEditModal(client);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>

                <Link
                  href="/quotations/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Buat Penawaran</span>
                </Link>

                <Link
                  href="/invoices/new"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Buat Faktur</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
