-- =============================================
-- SITB Screening App — Supabase Database Schema
-- Jalankan di Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing jika ada (untuk fresh setup)
DROP TABLE IF EXISTS screenings CASCADE;
DROP TYPE IF EXISTS screening_status CASCADE;

-- Enum status skrining
CREATE TYPE screening_status AS ENUM ('pending', 'approved', 'rejected', 'submitted');

-- Tabel utama skrining
CREATE TABLE screenings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status screening_status DEFAULT 'pending',

  -- Identitas Peserta
  tanggal_skrining DATE NOT NULL,
  nama_kegiatan TEXT DEFAULT 'Skrining Oleh Fasyankes',
  tempat_skrining TEXT,
  unit_pelaksana TEXT DEFAULT 'Puskesmas Tanjungwangi',
  kewarganegaraan TEXT DEFAULT 'WNI',
  nik TEXT NOT NULL,
  nama_peserta TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL,
  tanggal_lahir DATE NOT NULL,
  pekerjaan TEXT NOT NULL,
  no_hp TEXT,

  -- Alamat KTP
  provinsi_ktp TEXT NOT NULL,
  kabupaten_ktp TEXT NOT NULL,
  kecamatan_ktp TEXT,
  kelurahan_ktp TEXT,
  alamat_ktp TEXT NOT NULL,

  -- Alamat Domisili
  sama_dengan_ktp TEXT DEFAULT 'Ya',
  provinsi_domisili TEXT,
  kabupaten_domisili TEXT,
  kecamatan_domisili TEXT,
  kelurahan_domisili TEXT,
  alamat_domisili TEXT,

  -- Pemeriksaan BB & TB
  berat_badan NUMERIC(5,2) NOT NULL,
  tinggi_badan NUMERIC(5,2) NOT NULL,
  hasil_status_gizi TEXT,

  -- Riwayat Kontak TBC
  riwayat_kontak_tbc TEXT NOT NULL,

  -- Faktor Risiko
  pernah_tbc TEXT NOT NULL,
  kekurangan_gizi TEXT NOT NULL,
  merokok TEXT NOT NULL,
  riwayat_dm TEXT NOT NULL,
  odha TEXT NOT NULL,

  -- Skrining Gejala & Tanda
  batuk TEXT NOT NULL,
  bb_turun TEXT NOT NULL,
  demam TEXT NOT NULL,
  berkeringat TEXT NOT NULL,
  pembesaran_kelenjar TEXT NOT NULL,

  -- Hasil
  hasil_skrining TEXT NOT NULL,
  dilakukan_cxr TEXT NOT NULL,
  terduga_tbc TEXT,

  -- Keterangan & Metadata admin
  keterangan TEXT DEFAULT 'Tracing TB 2026',
  catatan_petugas TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ
);

-- View dengan kalkulasi IMT dan Umur (lebih aman daripada GENERATED ALWAYS)
CREATE OR REPLACE VIEW screenings_view AS
SELECT
  *,
  DATE_PART('year', AGE(tanggal_lahir))::INTEGER AS umur,
  ROUND((berat_badan / ((tinggi_badan/100) * (tinggi_badan/100)))::NUMERIC, 2) AS imt
FROM screenings;

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_screenings_updated_at
  BEFORE UPDATE ON screenings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;

-- Policy: siapa saja bisa INSERT (form warga publik)
CREATE POLICY "Allow public insert" ON screenings
  FOR INSERT WITH CHECK (true);

-- Policy: hanya service_role yang bisa SELECT/UPDATE (via API server-side)
CREATE POLICY "Allow service role all" ON screenings
  USING (true)
  WITH CHECK (true);

-- Index untuk performa
CREATE INDEX idx_screenings_status ON screenings(status);
CREATE INDEX idx_screenings_created_at ON screenings(created_at DESC);
CREATE INDEX idx_screenings_nik ON screenings(nik);

-- Konfirmasi
SELECT 'Database setup selesai! Tabel screenings berhasil dibuat.' AS status;
