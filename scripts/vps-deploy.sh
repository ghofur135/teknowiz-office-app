#!/usr/bin/env bash

# =================================================================
# WizBilling - VPS Deployment & PM2 Runner Script
# PT Tekno Wiz Indonesia
# =================================================================

set -e

echo -e "\n\033[1;36m=================================================================\033[0m"
echo -e "\033[1;36m   🚀 WIZBILLING - VPS DEPLOY & PM2 RUNNER                       \033[0m"
echo -e "\033[0;33m      PT Tekno Wiz Indonesia | Production Server                 \033[0m"
echo -e "\033[1;36m=================================================================\033[0m\n"

# 1. Pastikan PM2 terinstall global
if ! command -v pm2 &> /dev/null; then
  echo -e "\033[0;33m⚠ PM2 belum terpasang secara global. Menginstall pm2...\033[0m"
  npm install -g pm2
fi

# 2. Setup file environment bila belum ada
if [ ! -f .env.local ] && [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo -e "\033[0;32m✔ Menyalin .env.example menjadi .env.local...\033[0m"
    cp .env.example .env.local
  fi
fi

# 3. Buat folder data, uploads, dan logs jika belum ada
mkdir -p data public/uploads/legality logs

# 4. Install dependencies
echo -e "\n\033[0;34mℹ [1/4] Menginstall dependencies npm...\033[0m"
npm install

# 5. Build aplikasi Next.js untuk production
echo -e "\n\033[0;34mℹ [2/4] Melakukan build Next.js production...\033[0m"
npm run build

# 6. Menjalankan / Reload via PM2 dengan file konfigurasi ekosistem
echo -e "\n\033[0;34mℹ [3/4] Menjalankan / reload aplikasi via PM2...\033[0m"
pm2 startOrReload ecosystem.config.js --update-env

# 7. Simpan daftar proses PM2 agar aktif otomatis saat reboot
echo -e "\n\033[0;34mℹ [4/4] Menyimpan state PM2...\033[0m"
pm2 save

echo -e "\n\033[1;32m=================================================================\033[0m"
echo -e "\033[1;32m   🎉 APLIKASI WIZBILLING BERHASIL BERJALAN DI VPS!             \033[0m"
echo -e "\033[1;32m=================================================================\033[0m"
pm2 status wizbilling
echo -e "\n\033[0;36mPerintah berguna PM2:\033[0m"
echo -e "  • Pantau Log Realtime : \033[1mnpm run pm2:logs\033[0m (atau pm2 logs wizbilling)"
echo -e "  • Cek Status Proses   : \033[1mnpm run pm2:status\033[0m"
echo -e "  • Restart Proses      : \033[1mnpm run pm2:restart\033[0m"
echo -e "  • Reload Zero-Downtime: \033[1mnpm run pm2:reload\033[0m"
echo -e "  • Hentikan Aplikasi   : \033[1mnpm run pm2:stop\033[0m\n"
