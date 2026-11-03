# Panduan Instalasi Kostku

Kostku terdiri dari dua bagian:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** | `Kode.gs` + `appsscript.json` | Google Apps Script (akun Google pemilik kost) |
| **Frontend** | isi ZIP `kostku-frontend.zip` (`index.html`, `css/`, `js/`) | GitHub Pages |

Urutannya **wajib**: backend dulu (untuk mendapatkan URL `/exec`), baru frontend.

---

## BAGIAN A — Backend (Google Apps Script)

Gunakan akun Google **milik pemilik kost**. Semua data (Sheets, foto KTP, PDF surat) akan tersimpan di Drive akun ini dan bersifat privat.

### A1. Buat proyek

1. Buka https://script.google.com → **Proyek baru**.
2. Ganti nama proyek (kiri atas) menjadi `Kostku API`.
3. Hapus semua isi `Code.gs`, lalu tempel **seluruh** isi `Kode.gs`. Tekan **Ctrl+S**.
4. Klik ⚙️ **Setelan proyek** → centang **"Tampilkan file manifes appsscript.json di editor"**.
5. Kembali ke **Editor**, buka `appsscript.json`, ganti seluruh isinya dengan isi `appsscript.json` dari paket ini. Simpan.

### A2. Jalankan setup (SEKALI saja)

1. Di toolbar, pilih fungsi **`setupAppEnvironment`** → klik **▶ Jalankan**.
2. Muncul "Otorisasi diperlukan" → **Tinjau izin** → pilih akun → **Advanced/Lanjutan** → **Buka Kostku API (tidak aman)** → **Izinkan**.
   > Peringatan "tidak aman" muncul karena script buatan sendiri belum diverifikasi Google. Ini normal.
3. Buka **Log eksekusi** di bawah. Catat:
   - **Username: `owner`**
   - **Sandi: (10 karakter acak)** ← simpan baik-baik, hanya tampil sekali.
4. Cek Google Drive: ada folder **📁 Kostku** berisi spreadsheet database + folder `KTP_Penghuni`, `Bukti_Transfer`, `Foto_Kamar`, `Nota_Pengeluaran`, `Surat_Perjanjian`, `Aset_Aplikasi`, `Backup_Mingguan`.

⚠️ **Jangan jalankan `setupAppEnvironment` dua kali.** Script sudah menolak setup ulang, tetapi kalau Anda menghapus Script Properties lalu menjalankannya lagi, folder baru akan terbentuk.

**Opsional (untuk uji coba/UAT):** jalankan **`isiDataContoh`** untuk mengisi 6 kamar, 3 penghuni, pembayaran, dan pengeluaran contoh. Hapus baris-barisnya di spreadsheet sebelum memasukkan data asli.

### A3. Deploy sebagai Web App

1. Klik **Terapkan / Deploy** → **Deployment baru**.
2. Ikon ⚙️ di samping "Pilih jenis" → **Aplikasi web**.
3. Isi:
   - **Jalankan sebagai:** *Saya (email Anda)*
   - **Yang memiliki akses:** *Siapa saja (Anyone)*
4. **Terapkan** → salin **URL aplikasi web** (berakhiran **`/exec`**).

> "Siapa saja" diperlukan agar halaman di GitHub Pages bisa memanggil API. Data tetap aman: setiap aksi wajib token login, peran Owner/Admin dicek di server, dan berkas Drive tidak pernah dibuat publik.

Uji cepat: buka URL `/exec` di browser. Harus muncul JSON seperti `{"success":true,"app":"Kostku","siap":true,...}`.

### A4. Setiap kali `Kode.gs` diubah

**Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan.** URL `/exec` tetap sama. (Membuat "Deployment baru" akan menghasilkan URL berbeda.)

### A5. Trigger otomatis

`setupAppEnvironment` sudah memasang trigger **per jam** (`tugasPerJam`) yang menjalankan:
- pengingat WhatsApp otomatis H-N, Hari H, dan H+3 pada jam yang diatur di menu Pengaturan,
- pengiriman antrean WhatsApp (broadcast) secara bertahap,
- penandaan kontrak yang habis masa sewanya (kamar kembali *Tersedia*),
- backup spreadsheet mingguan (8 backup terakhir disimpan).

Cek di menu ⏰ **Pemicu/Triggers**. Kalau hilang, jalankan fungsi **`pasangTrigger`**.

---

## BAGIAN B — WhatsApp (Fonnte paket Free)

1. Daftar di https://fonnte.com dan hubungkan **nomor WhatsApp khusus usaha** (scan QR seperti WhatsApp Web).
2. Salin **Token** perangkat dari dashboard Fonnte.
3. Login ke Kostku sebagai Owner → **Pengaturan → WhatsApp Gateway** → tempel token → **Simpan** → **Uji Koneksi**.

Batasan paket Free: ±1.000 pesan/bulan, ada watermark, **teks saja tanpa lampiran**. Surat PDF diunduh/dicetak dari aplikasi lalu diserahkan langsung. Kalau nomor terputus dari Fonnte, kegagalan tercatat di *WhatsApp → Riwayat Kirim* dan Owner mendapat email.

---

## BAGIAN C — Frontend ke GitHub Pages

### C1. Isi URL backend (WAJIB sebelum push)

1. Ekstrak `kostku-frontend.zip` ke folder baru, misalnya `Documents\kostku`.
2. Buka `js\config.js` dengan Notepad, ganti:
   ```js
   GAS_URL: 'PASTE_URL_WEB_APP_GAS_DI_SINI',
   ```
   menjadi URL `/exec` dari langkah A3. Simpan.

### C2. Folder yang di-`git init`

Folder kerjanya adalah **folder hasil ekstraksi ZIP itu sendiri** (contoh: `Documents\kostku`) — **bukan** folder induknya.

Sebelum `git init`, jalankan `dir` (PowerShell) atau `ls` (Mac/Linux) di folder itu. Yang harus terlihat:

```
index.html          ← wajib ada di sini
README.md
PANDUAN-INSTALASI.md
css\
js\
```

Kalau yang terlihat justru sebuah folder lain yang berisi `index.html`, masuk dulu ke folder tersebut (`cd nama-folder`). Jangan pernah menaruh `Kode.gs` di folder ini.

### C3. Push ke GitHub

Prasyarat: Git terpasang (https://git-scm.com), akun GitHub, dan repository baru **Public** tanpa README.

```bash
cd "C:\Users\NAMA\Documents\kostku"
git init
git add .
git commit -m "Upload pertama Kostku"
git branch -M main
git remote add origin https://github.com/USERNAME/kostku.git
git push -u origin main
```

Saat diminta password, tempel **Personal Access Token** (https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo**), bukan password akun. Layar memang tidak menampilkan apa pun saat token ditempel.

### C4. Aktifkan GitHub Pages

Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **(root)** → **Save**. Centang **Enforce HTTPS**. Tunggu 1–2 menit, situs tampil di `https://USERNAME.github.io/kostku/`.

### C5. Update berikutnya

```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
Kalau tampilan masih versi lama: **Ctrl+Shift+R** atau buka di jendela Incognito.

---

## BAGIAN D — Langkah pertama setelah online

1. Login `owner` + sandi dari Log eksekusi → **Akun Saya → Ganti Sandi**.
2. **Pengaturan**: isi nama kost, nama pemilik (Pihak Pertama surat), alamat, kontak, rekening, template WA, jam pengingat & zona waktu → **Simpan Perubahan**.
3. **Pengaturan → Hak Akses → Tambah**: buat akun Admin. Sandi awal tampil sekali; berikan langsung ke Admin.
4. **Kamar → Kamar Baru**: masukkan semua unit.
5. **Penghuni → Tambah**: data diri + foto KTP + kontrak. Surat PDF dan pesan sambutan WA bisa dibuat otomatis.
6. Opsional: **Surat Sewa → ✏️** untuk menyesuaikan isi template perjanjian (khusus Owner, setiap simpan menjadi versi baru).

## Hak akses ringkas

| Fitur | Owner | Admin |
|---|:-:|:-:|
| Beranda, kamar, penghuni (+KTP), pembayaran, pencarian | ✅ | ✅ |
| Kirim pengingat & broadcast WA | ✅ | ✅ |
| Buat surat dari template | ✅ | ✅ |
| Ubah template surat, pengeluaran, laporan, pengaturan, kelola akun | ✅ | ❌ |
| Hapus data | ✅ | ❌ |

Pembatasan dicek di server untuk setiap aksi, jadi Admin tidak bisa membukanya meski memanggil API langsung.

---

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| Halaman login menampilkan "GAS_URL belum diisi" | Isi `js/config.js` (C1), lalu push ulang. |
| "Tidak dapat terhubung ke server" | URL `/exec` salah, atau akses Web App bukan *Anyone*. Ulangi A3. |
| "Respons server tidak valid" | Deployment belum diperbarui setelah mengubah kode, atau akses bukan *Anyone*. |
| "Aplikasi belum di-setup" | `setupAppEnvironment` belum dijalankan / gagal. Cek Log eksekusi. |
| Lupa sandi Owner | Di editor Apps Script jalankan **`resetSandiOwner`**; sandi baru muncul di Log eksekusi. |
| "Terlalu banyak percobaan gagal" | Login dikunci 15 menit setelah 5 kali salah. Tunggu, atau Owner mereset sandi Admin. |
| Pesan WA berstatus *Gagal* | Nomor terputus dari Fonnte atau token salah. Pengaturan → Uji Koneksi, lalu *Riwayat Kirim → Kirim Ulang*. |
| Pengingat otomatis tidak terkirim | Cek trigger `tugasPerJam` (A5), sakelar *Otomasi Pengingat*, dan token Fonnte. |
| Situs GitHub 404 | `index.html` tidak berada di root repo. Lihat C2. |
| Tampilan tanpa warna/gaya | Folder `css/` atau `js/` tidak ikut ter-push. Selalu push lewat terminal, bukan "Upload files". |
