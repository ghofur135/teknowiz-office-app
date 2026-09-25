'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  FileCheck,
  Eye,
  Download,
  Trash2,
  Calendar,
  AlertCircle,
  Plus,
  X,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { CompanyDocument, CompanyDocumentCategory } from '@/lib/types';

const CATEGORIES: { key: CompanyDocumentCategory; label: string; iconDesc: string }[] = [
  { key: 'AKTA', label: 'Akta Pendirian / Perubahan', iconDesc: 'Akta Notaris PT' },
  { key: 'KEMENKUMHAM', label: 'SK Kemenkumham RI', iconDesc: 'Pengesahan Badan Hukum' },
  { key: 'NIB', label: 'NIB (Nomor Induk Berusaha)', iconDesc: 'Sertifikat Standar OSS' },
  { key: 'NPWP', label: 'NPWP Badan & SKT Pajak', iconDesc: 'Perpajakan Perusahaan' },
  { key: 'SPPKP', label: 'SPPKP (Pengukuhan PKP)', iconDesc: 'Pengusaha Kena Pajak' },
  { key: 'KTP_DIREKSI', label: 'KTP & NPWP Direktur Utama', iconDesc: 'Identitas Penanggung Jawab' },
  { key: 'REKENING_BANK', label: 'Buku Rekening / Giro Bank', iconDesc: 'Legalitas Finansial' },
  { key: 'SERTIFIKASI', label: 'Sertifikasi PSE & Lisensi', iconDesc: 'Izin Kominfo / Industri' },
  { key: 'LAINNYA', label: 'Dokumen Legalitas Lainnya', iconDesc: 'Berkas Pendukung' },
];

export default function LegalityPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CompanyDocumentCategory>('AKTA');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isLifetime, setIsLifetime] = useState(true);
  const [notes, setNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/legality');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to load legality documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCategorySelect = (catKey: CompanyDocumentCategory) => {
    setCategory(catKey);
    // Auto suggest title based on category if empty
    const matched = CATEGORIES.find(c => c.key === catKey);
    if (matched && (!title || title.startsWith('Dokumen'))) {
      setTitle(`${matched.label} PT Tekno Wiz Indonesia`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        // Use clean filename as initial title
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Silakan pilih berkas dokumen yang akan diunggah.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('document_category', category);
      if (documentNumber) formData.append('document_number', documentNumber);
      if (issueDate) formData.append('issue_date', issueDate);
      if (!isLifetime && expiryDate) formData.append('expiry_date', expiryDate);
      formData.append('is_lifetime', isLifetime ? '1' : '0');
      if (notes) formData.append('notes', notes);

      const res = await fetch('/api/legality', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        // Reset form & close modal
        setShowUploadModal(false);
        setFile(null);
        setTitle('');
        setDocumentNumber('');
        setIssueDate('');
        setExpiryDate('');
        setIsLifetime(true);
        setNotes('');
        loadDocuments();
      } else {
        setUploadError(json.error || 'Gagal mengunggah dokumen.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Terjadi kesalahan sistem saat unggah.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, docTitle: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus berkas "${docTitle}"? Berkas fisik di server juga akan dihapus secara permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/legality/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== id));
      } else {
        alert('Gagal menghapus dokumen.');
      }
    } catch {
      alert('Terjadi kesalahan saat menghapus dokumen.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'ALL' || doc.document_category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.document_number && doc.document_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Compliance check: 6 core legal documents
  const coreLegalDocs: { key: CompanyDocumentCategory; name: string }[] = [
    { key: 'AKTA', name: 'Akta Pendirian PT' },
    { key: 'KEMENKUMHAM', name: 'SK Kemenkumham RI' },
    { key: 'NIB', name: 'NIB OSS RBA' },
    { key: 'NPWP', name: 'NPWP Badan & SKT' },
    { key: 'SPPKP', name: 'SPPKP (PKP)' },
    { key: 'KTP_DIREKSI', name: 'KTP & NPWP Direktur' },
  ];

  const uploadedCategories = new Set(documents.map((d) => d.document_category));
  const uploadedCoreCount = coreLegalDocs.filter((c) => uploadedCategories.has(c.key)).length;
  const compliancePercentage = Math.round((uploadedCoreCount / coreLegalDocs.length) * 100);

  return (
    <div className="flex-1 flex flex-col antialiased">
      <Navbar
        title="Arsip Dokumen Legalitas PT"
        subtitle="Pusat kepatuhan hukum notaris, NIB, NPWP, dan sertifikasi badan usaha"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Arsip Dokumen Legalitas Perusahaan
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  PT Tekno Wiz Indonesia • Pusat Berkas Kepatuhan Hukum, Notaris & Pajak
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadError('');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Dokumen Legalitas</span>
            </button>
          </div>
        </div>

        {/* Compliance Checklist Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Kelengkapan Berkas Tender & Vendor B2B / B2G</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {uploadedCoreCount} dari {coreLegalDocs.length} Terunggah ({compliancePercentage}%)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar 6 dokumen pokok yang rutin diminta dinas pemerintah (RSUD, Pemda) & korporasi saat pengadaan/SPK.
              </p>
            </div>
            <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden self-start sm:self-auto">
              <div
                className={`h-full transition-all duration-500 ${
                  compliancePercentage === 100
                    ? 'bg-emerald-500'
                    : compliancePercentage >= 50
                    ? 'bg-sky-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${compliancePercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {coreLegalDocs.map((docItem) => {
              const isUploaded = uploadedCategories.has(docItem.key);
              return (
                <div
                  key={docItem.key}
                  onClick={() => setSelectedCategory(docItem.key)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    isUploaded
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                      {docItem.key}
                    </span>
                    {isUploaded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {docItem.name}
                  </p>
                  <span
                    className={`text-[9px] font-semibold uppercase ${
                      isUploaded ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {isUploaded ? '✓ Tersedia' : '○ Belum Diunggah'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama dokumen, nomor registrasi, atau catatan..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-xs"
              />
            </div>

            {/* Total Badge */}
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 self-end md:self-auto">
              <span>Menampilkan:</span>
              <span className="font-bold text-slate-800">{filteredDocs.length} berkas</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua ({documents.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = documents.filter((d) => d.document_category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.key
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === cat.key
                          ? 'bg-sky-800 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat arsip legalitas perusahaan...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Belum Ada Dokumen Legalitas</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {selectedCategory !== 'ALL'
                  ? `Belum ada berkas untuk kategori ini. Klik tombol di bawah untuk mengunggah dokumen baru.`
                  : `Unggah berkas resmi PT Tekno Wiz Indonesia (Akta Notaris, SK Kemenkumham, NIB, NPWP Badan) agar siap digunakan sewaktu-waktu untuk penagihan dan tender.`}
              </p>
            </div>
            <button
              onClick={() => {
                if (selectedCategory !== 'ALL') {
                  setCategory(selectedCategory as CompanyDocumentCategory);
                }
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Dokumen Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const isPdf = doc.file_type.includes('pdf') || doc.file_name.toLowerCase().endsWith('.pdf');
              const categoryObj = CATEGORIES.find((c) => c.key === doc.document_category);

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header Card: Category & Format Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {categoryObj?.label || doc.document_category}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isPdf
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-sky-100 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {isPdf ? 'PDF' : 'IMAGE'}
                      </span>
                    </div>

                    {/* Title & Document Number */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {doc.title}
                      </h3>
                      {doc.document_number && (
                        <p className="text-xs font-mono text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                          No: {doc.document_number}
                        </p>
                      )}
                    </div>

                    {/* Meta Info: Issue Date, Lifetime, File Size */}
                    <div className="space-y-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      {doc.issue_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tgl Terbit: {doc.issue_date}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Masa Berlaku:{' '}
                          <strong className="text-emerald-700">
                            {doc.is_lifetime ? 'Seumur Hidup / Permanen' : doc.expiry_date || '-'}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                        <span>{doc.file_name}</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>

                      {doc.notes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                          "{doc.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Preview in Browser */}
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition-colors"
                        title="Buka / Pratinjau Dokumen"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </a>

                      {/* Download */}
                      <a
                        href={doc.file_path}
                        download={doc.file_name}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                        title="Unduh File"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </a>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Upload Dokumen Legalitas */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Upload Dokumen Legalitas Perusahaan
                  </h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUploadSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Dropzone File */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Pilih File Dokumen Resmi * (PDF, JPG, PNG, maks. 25MB)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      file
                        ? 'border-sky-500 bg-sky-50/40'
                        : 'border-slate-300 hover:border-sky-400 bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      required
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileCheck className="w-8 h-8 text-sky-600 shrink-0" />
                        <div className="text-left space-y-0.5">
                          <p className="font-bold text-slate-800 line-clamp-1">{file.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {formatFileSize(file.size)} • Klik untuk mengganti berkas
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-700">
                          Klik untuk memilih berkas atau seret file ke sini
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Mendukung PDF, PNG, JPG resolusi tinggi (scan resmi notaris/kementerian)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kategori Dokumen */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Kategori Dokumen *</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategorySelect(e.target.value as CompanyDocumentCategory)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label} ({cat.iconDesc})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Judul Dokumen */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Nama / Judul Dokumen *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Akta Pendirian PT Tekno Wiz Indonesia No. 12"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Nomor Dokumen / Registrasi */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Nomor Dokumen / SK / Registrasi Resmi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Contoh: AHU-0012345.AH.01.01.TAHUN 2024 atau 0220109123456"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Tanggal Terbit & Masa Berlaku */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Tanggal Penerbitan</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Masa Berlaku</label>
                    <div className="pt-2 flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isLifetime}
                          onChange={(e) => setIsLifetime(e.target.checked)}
                          className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                        />
                        <span className="font-semibold text-slate-700 text-xs">
                          Seumur Hidup / Permanen
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {!isLifetime && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Tanggal Kedaluwarsa</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}

                {/* Catatan / Keterangan */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Catatan / Deskripsi (Opsional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Salinan notaris asli, digunakan untuk lampiran penagihan RSUD."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Simpan Dokumen</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
