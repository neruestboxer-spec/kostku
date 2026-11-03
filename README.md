# Kostku — Manajemen Kost & Kontrakan

Frontend statis (HTML/CSS/JavaScript murni) untuk aplikasi Kostku. Backend berjalan di Google Apps Script sebagai REST API JSON, dengan Google Sheets sebagai database dan Google Drive (privat) untuk foto KTP, bukti bayar, dan PDF surat perjanjian.

## Struktur

```
index.html            kerangka halaman + login
css/style.css         design system (Plus Jakarta Sans, teal #1B5E5A, amber #F2B544)
js/config.js          ⚠️ isi GAS_URL di sini
js/util.js            ikon, format rupiah/tanggal, toast, bottom sheet, kompres gambar
js/api.js             fetch POST text/plain ke Apps Script
js/app.js             sesi, router hash, navigasi, berkas privat
js/pages-utama.js     Beranda, Kamar, Penghuni
js/pages-keuangan.js  Pembayaran, Catat Bayar, Pengeluaran, Laporan
js/pages-lainnya.js   WhatsApp, Surat Perjanjian, Pengaturan, Akun
```

## Fitur

- Login Owner/Admin, sandi di-hash, sesi berakhir setelah 60 menit tidak aktif, penguncian setelah 5 kali gagal
- Dashboard kamar kosong/terisi, tagihan jatuh tempo & menunggak, pemasukan bulan ini (Owner)
- Kamar (foto, fasilitas, tarif, status Tersedia/Terisi/Perbaikan otomatis)
- Penghuni + foto KTP terkompres, kontrak, checkout, perpanjangan, riwayat bayar
- Pembayaran multi-periode, cicilan, bukti transfer, pencegahan pencatatan ganda
- WhatsApp via Fonnte (paket Free): pengingat, teguran, broadcast, antrean berjeda, kuota bulanan, kirim ulang
- Surat perjanjian dari template berversi → PDF di Drive
- Pengeluaran, laporan bulanan (grafik 6 bulan, okupansi, tunggakan), ekspor CSV/PDF
- Pengaturan profil kost, rekening, otomasi, template WA, token Fonnte, akun Admin, backup

Panduan lengkap: **PANDUAN-INSTALASI.md**.
