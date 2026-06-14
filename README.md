# ☕ Wil's Coffee Shop - Premium POS KASIR & Admin Dashboard

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)

Sistem Kasir (Point of Sale) modern berbasis Web lengkap dengan Back-Office Admin. Dirancang dengan UI/UX premium yang bersih, interaktif, dan responsif. Sangat cocok untuk bisnis F&B modern seperti Coffee Shop, Kafe, Restoran, maupun *Franchise*.

Aplikasi ini dibangun menggunakan *Best Practices* industri, mengedepankan performa (*Fast Loading*), *Clean Code*, serta keamanan transaksi (*Database Transaction*).

---

## 🌟 Fitur Utama (Key Features)

### 🧑‍🍳 1. Frontend POS (Aplikasi Kasir)
- **🔐 Sistem Login PIN:** Keamanan terjamin. Setiap kasir memiliki PIN unik (6-digit) untuk masuk, mencegah akses tidak sah.
- **📱 Smart Cart & Grid Menu:** Tampilan menu berbasis kartu dengan fitur pencarian interaktif dan filter kategori.
- **📦 Smart Stock Validation:** Validasi stok pintar. Jika stok habis, menu tidak bisa diklik ("HABIS").
- **💳 Multi-Payment & Kalkulator:** Mendukung pembayaran *Cash*, *QRIS*, dan *Kartu EDC*. Otomatis menghitung uang kembalian.
- **🏷️ Diskon & Pajak Dinamis:** Input diskon dalam nominal Rupiah dan perhitungan Pajak/PPN otomatis.
- **📝 Tipe Pesanan & Catatan:** Opsi *Dine In* (Makan di Tempat) atau *Take Away* (Bawa Pulang), serta input catatan per pesanan.
- **🖨️ Hardware & Print Ready:** Mendukung pencetakan struk *Thermal* ke Browser/PDF dan Printer Bluetooth Android (via *RawBT Intent*).
- **📋 Riwayat Transaksi:** Cek ulang dan cetak ulang (*reprint*) struk transaksi pada hari yang sama.

### ⚙️ 2. Back-Office Admin (Dashboard)
- **📊 Analitik Penjualan:** Ringkasan pendapatan, total transaksi, dan grafik interaktif penjualan bulanan.
- **📅 Laporan Fleksibel:** Filter laporan (Hari Ini, 7 Hari Terakhir, Bulan Ini, Semua Waktu) dan cetak.
- **📥 Export Data:** Unduh laporan transaksi langsung ke format **Excel / CSV**.
- **🍔 Manajemen Menu & Kategori:** CRUD (Tambah, Edit, Hapus) menu, harga, gambar, stok awal, dan kategori produk.
- **👥 Manajemen Pegawai:** Tambah akun kasir baru beserta PIN rahasia mereka.
- **🏪 Pengaturan Toko Dinamis:** Ubah nama kafe, alamat struk, dan persentase pajak (contoh: 11%) langsung dari UI tanpa *hardcode*.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

**Frontend:**
- [React.js](https://reactjs.org/) (Vite)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router DOM](https://reactrouter.com/)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- `mysql2` (Connection Pooling & Raw Query)
- `cors` & `dotenv`

**Database:**
- MySQL / MariaDB (XAMPP / Laragon / Docker)

---

## 🚀 Panduan Instalasi (Installation Guide)

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi secara lokal di komputer Anda:

### 1. Persiapan Database (MySQL)
1. Buka aplikasi XAMPP/Laragon dan jalankan **MySQL**.
2. Buat database baru bernama `coffeeshop`.
3. *Run* atau *Import* file Schema SQL (jika tersedia), atau jalankan file *Seed*.

### 2. Setup Backend (Node.js API)
1. Buka terminal dan arahkan ke folder utama *backend*.
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Buat file `.env` di *root backend* dan sesuaikan konfigurasi DB Anda:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=coffeeshop
   ```
4. *(Opsional)* Jalankan *seeder* untuk mengisi data awal:
   ```bash
   npx ts-node seed.ts
   ```
5. Jalankan server backend:
   ```bash
   npm run dev
   # Server berjalan di http://localhost:3000
   ```

### 3. Setup Frontend (React POS)
1. Buka terminal baru dan arahkan ke folder `frontend`.
2. Instal dependensi frontend:
   ```bash
   npm install
   ```
3. Jalankan aplikasi frontend:
   ```bash
   npm run dev
   ```
4. Buka browser dan akses URL yang diberikan Vite (biasanya `http://localhost:5173`).

---

## 🔑 Akses Default (Testing)

- **Akses Admin Dashboard:** `http://localhost:5173/admin`
- **Password Admin:** `admin123`
- **PIN Kasir (Bawaan Seeder):** `123456`

---

## 📄 Lisensi

Dibuat untuk keperluan bisnis, portofolio, dan pembelajaran.
