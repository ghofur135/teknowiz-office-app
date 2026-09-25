#!/bin/bash
set -e

echo "🚀 [1/4] Mengambil kode terbaru dari GitHub..."
cd /home/dhimas/docker/teknowiz-office-app
git pull origin main

echo "📦 [2/4] Memeriksa dependensi baru..."
npm install

echo "⚙️ [3/4] Melakukan build Next.js production..."
npm run build

echo "🔄 [4/4] Reload PM2 (Zero-downtime)..."
pm2 reload wizbilling

echo "✅ WizBilling berhasil diperbarui dan online!"
