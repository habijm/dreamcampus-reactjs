# 🎓 Dream Campus

> Platform rekomendasi kampus IT untuk siswa SMA menggunakan Content-Based Filtering

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-ready-3ecf8e?logo=supabase)

---

## ✨ Fitur

### Untuk Pengguna (Tanpa Login)
- 🏠 **Landing Page** — Hero, statistik, daftar kampus unggulan, CTA
- 🔍 **Rekomendasi Kampus** — Form preferensi + Content-Based Filtering
- 🏛️ **Daftar Kampus** — Dengan filter lokasi, akreditasi, jenis kampus
- 📋 **Detail Kampus** — Info lengkap, jurusan IT, biaya, deskripsi

### Admin Dashboard (Login Required)
- 📊 **Dashboard** — Total kampus, jurusan, pencarian; grafik aktivitas
- 🏫 **Manajemen Kampus** — CRUD lengkap + upload logo
- 📚 **Manajemen Jurusan** — CRUD dengan filter kampus
- 📈 **Statistik** — Grafik tren pencarian, minat bidang IT, top rekomendasi

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| UI Components | Shadcn/UI (Radix) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| Routing | React Router v6 |
| Deploy | Vercel |

---

## 🚀 Setup & Development

### 1. Clone & Install

```bash
git clone https://github.com/your-username/dream-campus.git
cd dream-campus
npm install
```

### 2. Setup Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Buka **SQL Editor** → jalankan isi file `supabase-schema.sql`
3. Buka **Authentication** → tambah user admin:
   - Email: `admin@dreamcampus.id`
   - Password: pilih password kuat
4. Jalankan SQL untuk registrasi admin di tabel admins (lihat bagian akhir `supabase-schema.sql`)
5. Buka **Settings → API** → copy `Project URL` dan `anon public key`

### 3. Konfigurasi .env

```bash
cp .env.example .env
```

Isi `.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Jalankan Development

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173)

---

## 📦 Deploy ke Vercel

### Cara 1: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Cara 2: Via GitHub (Rekomendasi)
1. Push ke GitHub
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repo
3. Set **Environment Variables**:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   ```
4. Klik **Deploy** ✅

---

## 🧠 Algoritma Content-Based Filtering

Sistem rekomendasi menggunakan weighted cosine similarity dengan 5 dimensi fitur:

| Fitur | Bobot |
|-------|-------|
| Bidang IT | 35% |
| Jurusan | 25% |
| Lokasi | 15% |
| Akreditasi | 15% |
| Biaya Kuliah | 10% |

Skor final = `Σ(score_fitur × bobot)` × 100

---

## 📁 Struktur Folder

```
src/
├── components/
│   ├── ui/           # Shadcn/UI components
│   ├── layout/       # Navbar, Footer
│   ├── campus/       # CampusCard
│   └── admin/        # AdminLayout
├── pages/
│   ├── LandingPage.jsx
│   ├── RecommendationPage.jsx
│   ├── CampusListPage.jsx
│   ├── CampusDetailPage.jsx
│   └── admin/
│       ├── AdminLoginPage.jsx
│       ├── AdminDashboardPage.jsx
│       ├── AdminCampusPage.jsx
│       ├── AdminMajorPage.jsx
│       └── AdminStatistikPage.jsx
├── lib/
│   ├── supabase.js       # Supabase client
│   ├── services.js       # API + mock data switcher
│   ├── recommendation.js # CBF algorithm
│   ├── mockData.js       # Demo data
│   └── utils.js          # Helpers
└── App.jsx               # Router
```

---

## 🎯 Demo Mode

Tanpa konfigurasi Supabase, aplikasi berjalan dengan **demo/mock data** secara otomatis.

Login admin demo:
- Email: `admin@dreamcampus.id`
- Password: `admin123`

---

## 📄 License

MIT © 2025 DreamCampus
