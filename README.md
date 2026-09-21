# Skrining TBC — Puskesmas Tanjungwangi

Aplikasi web skrining TBC terintegrasi SITB, dibangun dengan Next.js 14, Supabase, dan Playwright.

## Fitur

- 📋 **Form Warga** — Multi-step form skrining TBC yang mudah diisi
- 🔐 **Admin Panel** — Review dan approve data sebelum dikirim ke SITB
- 🤖 **Auto-fill SITB** — Script Playwright otomatis mengisi form SITB
- 💾 **Supabase** — Penyimpanan data real-time & autentikasi petugas

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/USERNAME/sitb-screening.git
cd sitb-screening
npm install
```

### 2. Buat file `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Setup Database Supabase

Buka **Supabase Dashboard → SQL Editor**, paste dan jalankan isi file:
```
scripts/setup-db.sql
```

### 4. Buat User Admin di Supabase

- Buka **Supabase → Authentication → Users**
- Klik **"Add user"**
- Masukkan email dan password petugas

### 5. Jalankan Lokal

```bash
npm run dev
```

Buka http://localhost:3000

---

## Deploy ke Vercel

### Cara Termudah (Recommended)

1. Push ke GitHub
2. Buka [vercel.com](https://vercel.com) → **"Import Project"** → pilih repo ini
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Klik **Deploy** ✅

### Via GitHub Actions (Auto-deploy)

Tambahkan secrets di GitHub repo:
- `VERCEL_TOKEN` — dari Vercel Account Settings
- `VERCEL_ORG_ID` — dari `.vercel/project.json` 
- `VERCEL_PROJECT_ID` — dari `.vercel/project.json`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Penggunaan Auto-fill SITB

### Setup (sekali saja)

```bash
# Install Playwright browser
npx playwright install chromium

# Buat file kredensial SITB
cp .env.sitb.example .env.sitb
# Edit .env.sitb dengan username/password SITB Anda
```

### Jalankan Auto-fill

```bash
# Ganti <uuid> dengan ID dari admin dashboard
npx ts-node playwright/sitb-autofill.ts --id <uuid>
```

Script akan:
1. 🔐 Login ke SITB
2. ✍️ Mengisi semua field form otomatis
3. 📸 Menyimpan screenshot di `playwright/screenshots/`
4. ✅ Update status di Supabase menjadi `submitted`

---

## Struktur Proyek

```
sitb-screening/
├── app/
│   ├── page.tsx              # Form warga (publik)
│   ├── success/page.tsx      # Halaman sukses
│   ├── admin/
│   │   ├── page.tsx          # Login admin
│   │   └── dashboard/
│   │       ├── page.tsx      # Daftar data
│   │       └── [id]/page.tsx # Detail & review
│   └── api/
│       ├── screening/route.ts
│       ├── screening/[id]/route.ts
│       └── admin/login/route.ts
├── components/
│   ├── ScreeningForm.tsx
│   ├── steps/
│   │   ├── Step1Identitas.tsx
│   │   ├── Step2Alamat.tsx
│   │   ├── Step3Pemeriksaan.tsx
│   │   └── Step4Gejala.tsx
│   ├── FormField.tsx
│   └── RadioGroup.tsx
├── lib/
│   ├── supabase.ts
│   └── validations.ts
├── playwright/
│   └── sitb-autofill.ts      # Script auto-fill
└── scripts/
    └── setup-db.sql          # Schema database
```

## Alur Kerja

```
Warga mengisi form → Simpan ke Supabase (status: pending)
                          ↓
          Petugas review di admin panel
                          ↓
           Approve → (status: approved)
                          ↓
    Jalankan: npx ts-node playwright/sitb-autofill.ts --id <uuid>
                          ↓
          SITB terisi otomatis → (status: submitted)
```
