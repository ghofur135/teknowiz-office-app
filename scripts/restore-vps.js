#!/usr/bin/env node

/**
 * WizBilling - Auto Restore / Migration Script ke VPS
 * PT Tekno Wiz Indonesia
 * 
 * Script ini mengotomatiskan migrasi/sinkronisasi:
 * 1. Database SQLite (data/billing.sqlite3) dengan auto WAL-checkpoint
 * 2. Seluruh file berkas upload resmi (public/uploads/legality/*.pdf)
 * 3. Pembuatan direktori remote & permission fix
 * 4. Opsional auto-reload PM2 jika ada
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('ssh2');
const { createClient } = require('@libsql/client');

// Styling Terminal Helper
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function banner() {
  console.log('\n' + colors.cyan + colors.bright + '=================================================================' + colors.reset);
  console.log(colors.cyan + colors.bright + '   🚀 WIZBILLING - VPS AUTO-RESTORE & DATA MIGRATION TOOL        ' + colors.reset);
  console.log(colors.dim + '      PT Tekno Wiz Indonesia | Standalone Invoice & Office App   ' + colors.reset);
  console.log(colors.cyan + colors.bright + '=================================================================' + colors.reset + '\n');
}

// Prompt Helper dengan Masking Password
function askQuestion(query, isPassword = false, defaultValue = '') {
  return new Promise((resolve) => {
    const promptText = defaultValue ? `${query} [${colors.yellow}${defaultValue}${colors.reset}]: ` : `${query}: `;

    if (isPassword) {
      process.stdout.write(promptText);
      const stdin = process.stdin;
      let password = '';

      const isTTY = stdin.isTTY;
      const wasRaw = stdin.isRaw;
      if (isTTY) stdin.setRawMode(true);
      stdin.resume();

      const onData = (chunk) => {
        const str = chunk.toString();
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '\r' || char === '\n' || char === '\u0004') {
            if (isTTY) stdin.setRawMode(wasRaw);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(password.trim() || defaultValue);
            return;
          } else if (char === '\u0003') { // Ctrl+C
            process.stdout.write('\n' + colors.red + 'Operasi dibatalkan oleh pengguna.' + colors.reset + '\n');
            process.exit(1);
          } else if (char === '\b' || char === '\x7f') { // Backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else {
            password += char;
            process.stdout.write('*');
          }
        }
      };

      stdin.on('data', onData);
    } else {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(promptText, (answer) => {
        rl.close();
        resolve(answer.trim() || defaultValue);
      });
    }
  });
}

// Checkpoint SQLite WAL mode sebelum copy
async function checkpointLocalDatabase() {
  const dbFile = path.join(process.cwd(), 'data', 'billing.sqlite3');
  if (!fs.existsSync(dbFile)) {
    throw new Error(`Database tidak ditemukan di ${dbFile}! Jalankan "npm run seed" terlebih dahulu.`);
  }

  console.log(`${colors.blue}ℹ${colors.reset} Melakukan SQLite WAL checkpoint untuk sinkronisasi data terbaru...`);
  try {
    const db = createClient({ url: `file:${dbFile}` });
    await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
    console.log(`${colors.green}✔${colors.reset} SQLite WAL checkpoint selesai. Database siap ditransfer.`);
  } catch (err) {
    console.log(`${colors.yellow}⚠${colors.reset} Info WAL checkpoint: ${err.message} (melanjutkan pengiriman db utama).`);
  }
}

// Cari seluruh file di lokal rekursif
function getLocalFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getLocalFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

// Jalankan command SSH jarak jauh
function runRemoteCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      stream.on('data', (data) => {
        stdout += data.toString();
      });
      stream.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    });
  });
}

// Upload file via SFTP dengan fastPut
function uploadFile(sftp, localFile, remoteFile) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function main() {
  banner();

  // 1. INPUT WAJIB
  let host = await askQuestion(`${colors.bright}1. IP VPS / Hostname${colors.reset}`);
  while (!host) {
    console.log(colors.red + '   [Error] IP VPS wajib diisi!' + colors.reset);
    host = await askQuestion(`${colors.bright}1. IP VPS / Hostname${colors.reset}`);
  }

  const portStr = await askQuestion(`${colors.bright}2. Port SSH${colors.reset}`, false, '22');
  const port = parseInt(portStr, 10) || 22;

  let username = await askQuestion(`${colors.bright}3. Username SSH VPS${colors.reset}`, false, 'root');
  while (!username) {
    console.log(colors.red + '   [Error] Username SSH wajib diisi!' + colors.reset);
    username = await askQuestion(`${colors.bright}3. Username SSH VPS${colors.reset}`, false, 'root');
  }

  let password = await askQuestion(`${colors.bright}4. Password SSH VPS${colors.reset}`, true);
  while (!password) {
    console.log(colors.red + '   [Error] Password SSH wajib diisi!' + colors.reset);
    password = await askQuestion(`${colors.bright}4. Password SSH VPS${colors.reset}`, true);
  }

  const defaultRemotePath = `/var/www/teknowiz-office-app`;
  const remotePath = await askQuestion(
    `${colors.bright}5. Direktori Aplikasi di VPS${colors.reset}`,
    false,
    defaultRemotePath
  );

  console.log('\n' + colors.cyan + '-----------------------------------------------------------------' + colors.reset);
  console.log(`Menghubungkan ke ${colors.green}${username}@${host}:${port}${colors.reset}...`);

  // 2. CHECKPOINT DATABASE LOKAL
  await checkpointLocalDatabase();

  // 3. KONEKSI SSH
  const conn = new Client();

  conn.on('error', (err) => {
    console.error('\n' + colors.red + colors.bright + '✖ Gagal terhubung ke VPS:' + colors.reset, err.message);
    if (err.message.includes('authentication')) {
      console.log(colors.yellow + '👉 Periksa kembali username & password VPS Anda.' + colors.reset);
    } else if (err.message.includes('timed out') || err.message.includes('ECONNREFUSED')) {
      console.log(colors.yellow + `👉 Periksa apakah port SSH (${port}) dan IP (${host}) sudah benar serta firewall VPS terbuka.` + colors.reset);
    }
    process.exit(1);
  });

  conn.on('ready', async () => {
    console.log(`${colors.green}✔ Terhubung ke VPS melalui SSH!${colors.reset}\n`);

    try {
      // 4. Verifikasi dan buat direktori remote
      console.log(`${colors.blue}ℹ${colors.reset} Memastikan struktur folder tujuan di VPS ada: ${remotePath}`);
      const mkdirCmd = `mkdir -p "${remotePath}/data" "${remotePath}/public/uploads/legality"`;
      const mkRes = await runRemoteCommand(conn, mkdirCmd);
      if (mkRes.code !== 0) {
        throw new Error(`Gagal membuat folder di VPS: ${mkRes.stderr}`);
      }
      console.log(`${colors.green}✔${colors.reset} Folder remote siap.`);

      // 5. Inisiasi SFTP
      conn.sftp(async (err, sftp) => {
        if (err) {
          console.error(colors.red + '✖ Gagal membuka sesi SFTP:' + colors.reset, err.message);
          conn.end();
          process.exit(1);
        }

        try {
          // A. Upload Database SQLite
          const localDbPath = path.join(process.cwd(), 'data', 'billing.sqlite3');
          const remoteDbPath = `${remotePath}/data/billing.sqlite3`;
          const dbStat = fs.statSync(localDbPath);
          const dbSizeKb = (dbStat.size / 1024).toFixed(1);

          console.log(`\n${colors.cyan}--- Mengunggah Database SQLite ---${colors.reset}`);
          console.log(`  File: ${colors.yellow}data/billing.sqlite3${colors.reset} (${dbSizeKb} KB)`);
          await uploadFile(sftp, localDbPath, remoteDbPath);
          console.log(`  ${colors.green}✔ Database SQLite berhasil di-restore ke VPS!${colors.reset}`);

          // B. Upload File Dokumen Legalitas PDF
          console.log(`\n${colors.cyan}--- Mengunggah File Upload Dokumen Legalitas ---${colors.reset}`);
          const localUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'legality');
          const uploadFiles = getLocalFiles(localUploadsDir).filter(f => !f.endsWith('.gitkeep'));

          if (uploadFiles.length === 0) {
            console.log(`  ${colors.dim}Tidak ada file upload PDF lokal untuk disinkronkan.${colors.reset}`);
          } else {
            let uploadedCount = 0;
            let totalBytes = 0;

            for (const file of uploadFiles) {
              const fileName = path.basename(file);
              const stat = fs.statSync(file);
              totalBytes += stat.size;
              const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
              const remoteFilePath = `${remotePath}/public/uploads/legality/${fileName}`;

              process.stdout.write(`  [${uploadedCount + 1}/${uploadFiles.length}] Mengunggah ${fileName} (${sizeMb} MB)... `);
              await uploadFile(sftp, file, remoteFilePath);
              process.stdout.write(`${colors.green}OK${colors.reset}\n`);
              uploadedCount++;
            }

            const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
            console.log(`  ${colors.green}✔ ${uploadedCount} file dokumen legalitas (${totalMb} MB) berhasil di-restore!${colors.reset}`);
          }

          // C. Set File Permission di VPS (Linux Best Practice)
          console.log(`\n${colors.blue}ℹ${colors.reset} Mengatur file permission di VPS...`);
          await runRemoteCommand(conn, `chmod -R 755 "${remotePath}/data" "${remotePath}/public/uploads" && chmod 644 "${remotePath}/data/billing.sqlite3"`);

          // D. Cek apakah PM2 aktif di VPS
          console.log(`${colors.blue}ℹ${colors.reset} Memeriksa status proses PM2 di VPS...`);
          const pm2Check = await runRemoteCommand(conn, 'which pm2');
          if (pm2Check.code === 0 && pm2Check.stdout.trim()) {
            console.log(`${colors.yellow}⚡ Terdeteksi PM2 terinstall di VPS.${colors.reset} Mencoba reload proses bila ada...`);
            const pm2Reload = await runRemoteCommand(conn, 'pm2 reload all || true');
            console.log(pm2Reload.stdout ? pm2Reload.stdout.trim() : 'PM2 reload command executed.');
          }

          // SELESAI
          console.log('\n' + colors.green + colors.bright + '=================================================================' + colors.reset);
          console.log(colors.green + colors.bright + '   🎉 PROSES RESTORE & MIGRASI KE VPS SELESAI DENGAN SUKSES!    ' + colors.reset);
          console.log(colors.green + colors.bright + '=================================================================' + colors.reset);
          console.log(`\nData Anda telah sinkron di:`);
          console.log(`  • VPS IP     : ${colors.bright}${host}${colors.reset}`);
          console.log(`  • Folder App : ${colors.bright}${remotePath}${colors.reset}`);
          console.log(`  • Database   : ${colors.green}${remotePath}/data/billing.sqlite3${colors.reset}`);
          console.log(`  • Dokumen    : ${colors.green}${remotePath}/public/uploads/legality/${colors.reset}`);
          console.log(`\n${colors.dim}WizBilling siap diakses di VPS tanpa perlu re-upload manual.${colors.reset}\n`);

          conn.end();
          process.exit(0);

        } catch (uploadErr) {
          console.error('\n' + colors.red + '✖ Gagal melakukan transfer file via SFTP:' + colors.reset, uploadErr.message);
          conn.end();
          process.exit(1);
        }
      });

    } catch (e) {
      console.error('\n' + colors.red + '✖ Kesalahan saat eksekusi remote:' + colors.reset, e.message);
      conn.end();
      process.exit(1);
    }
  });

  // Hubungkan dengan password
  conn.connect({
    host,
    port,
    username,
    password,
    readyTimeout: 30000,
  });
}

main().catch((err) => {
  console.error('\n' + colors.red + 'Unexpected error:' + colors.reset, err);
  process.exit(1);
});
