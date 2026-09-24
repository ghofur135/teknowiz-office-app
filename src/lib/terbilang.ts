/**
 * Konversi angka ke terbilang bahasa Indonesia (Standar EBI / Rupiah)
 * Contoh: 15750000 -> "Lima Belas Juta Tujuh Ratus Lima Puluh Ribu Rupiah"
 */

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas'
];

function bilanganKeTeks(n: number): string {
  n = Math.floor(Math.abs(n));

  if (n < 12) {
    return SATUAN[n];
  } else if (n < 20) {
    return bilanganKeTeks(n - 10) + ' Belas';
  } else if (n < 100) {
    return (
      bilanganKeTeks(Math.floor(n / 10)) +
      ' Puluh ' +
      bilanganKeTeks(n % 10)
    ).trim();
  } else if (n < 200) {
    return ('Seratus ' + bilanganKeTeks(n - 100)).trim();
  } else if (n < 1000) {
    return (
      bilanganKeTeks(Math.floor(n / 100)) +
      ' Ratus ' +
      bilanganKeTeks(n % 100)
    ).trim();
  } else if (n < 2000) {
    return ('Seribu ' + bilanganKeTeks(n - 1000)).trim();
  } else if (n < 1000000) {
    return (
      bilanganKeTeks(Math.floor(n / 1000)) +
      ' Ribu ' +
      bilanganKeTeks(n % 1000)
    ).trim();
  } else if (n < 1000000000) {
    return (
      bilanganKeTeks(Math.floor(n / 1000000)) +
      ' Juta ' +
      bilanganKeTeks(n % 1000000)
    ).trim();
  } else if (n < 1000000000000) {
    return (
      bilanganKeTeks(Math.floor(n / 1000000000)) +
      ' Miliar ' +
      bilanganKeTeks(n % 1000000000)
    ).trim();
  } else if (n < 1000000000000000) {
    return (
      bilanganKeTeks(Math.floor(n / 1000000000000)) +
      ' Triliun ' +
      bilanganKeTeks(n % 1000000000000)
    ).trim();
  }
  return n.toString();
}

export function terbilangRupiah(amount: number): string {
  if (!amount || amount === 0) {
    return 'Nol Rupiah';
  }

  const hasil = bilanganKeTeks(amount);
  // Bersihkan spasi ganda
  const rapi = hasil.replace(/\s+/g, ' ').trim();
  return `${rapi} Rupiah`;
}

export function formatRupiah(amount: number, withPrefix = true): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

  return withPrefix ? `Rp ${formatted}` : formatted;
}
