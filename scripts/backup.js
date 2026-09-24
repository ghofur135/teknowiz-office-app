#!/usr/bin/env node

/**
 * WizBilling - Local Data Backup Bundler
 * PT Tekno Wiz Indonesia
 * 
 * Menghasilkan file arsip .tar.gz yang berisi:
 * - Database SQLite (data/billing.sqlite3) yang sudah di-checkpoint
 * - Seluruh dokumen legalitas resmi (public/uploads/legality/)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@libsql/client');

async function createBackup() {
  console.log('\n📦 Memulai proses backup data WizBilling...');

  const dbFile = path.join(process.cwd(), 'data', 'billing.sqlite3');
  if (!fs.existsSync(dbFile)) {
    console.error('✖ Database tidak ditemukan di data/billing.sqlite3!');
    process.exit(1);
  }

  // 1. SQLite WAL Checkpoint
  try {
    const db = createClient({ url: `file:${dbFile}` });
    await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
    console.log('✔ SQLite WAL checkpoint berhasil disinkronkan.');
  } catch (e) {
    console.log(`ℹ Info WAL checkpoint: ${e.message}`);
  }

  // 2. Buat direktori backups jika belum ada
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Format nama file: wizbilling-backup-YYYYMMDD-HHmmss.tar.gz
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const archiveName = `wizbilling-backup-${timestamp}.tar.gz`;
  const archivePath = path.join(backupsDir, archiveName);

  // 3. Arsipkan data/billing.sqlite3 dan public/uploads
  try {
    console.log('⏳ Mengompres file database & berkas legalitas...');
    // Path relative agar saat diekstrak langsung rapi
    const cmd = `tar -czf "${archivePath}" data/billing.sqlite3 public/uploads`;
    execSync(cmd, { stdio: 'inherit' });

    const stat = fs.statSync(archivePath);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

    console.log('\n=================================================================');
    console.log('🎉 BACKUP DATA BERHASIL DIBUAT!');
    console.log('=================================================================');
    console.log(`Lokasi File : ${archivePath}`);
    console.log(`Ukuran      : ${sizeMb} MB`);
    console.log(`Isi Paket   : Database SQLite + Dokumen Legalitas PDF`);
    console.log('\n💡 Cara restore manual di VPS:');
    console.log(`  1. Upload ${archiveName} ke folder projek di VPS`);
    console.log(`  2. Jalankan: tar -xzf ${archiveName}`);
    console.log('=================================================================\n');

  } catch (err) {
    console.error('✖ Gagal membuat file arsip:', err.message);
    process.exit(1);
  }
}

createBackup().catch(console.error);
