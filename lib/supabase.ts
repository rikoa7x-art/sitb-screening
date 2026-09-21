import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client dengan service role (untuk admin API routes)
export const supabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

export type ScreeningStatus = 'pending' | 'approved' | 'rejected' | 'submitted'

export interface Screening {
  id: string
  created_at: string
  updated_at: string
  status: ScreeningStatus

  // Identitas
  tanggal_skrining: string
  nama_kegiatan: string
  tempat_skrining: string
  unit_pelaksana: string
  kewarganegaraan: string
  nik: string
  nama_peserta: string
  jenis_kelamin: string
  tanggal_lahir: string
  umur: number
  pekerjaan: string
  no_hp: string

  // Alamat KTP
  provinsi_ktp: string
  kabupaten_ktp: string
  kecamatan_ktp: string
  kelurahan_ktp: string
  alamat_ktp: string

  // Alamat Domisili
  sama_dengan_ktp: string
  provinsi_domisili?: string
  kabupaten_domisili?: string
  kecamatan_domisili?: string
  kelurahan_domisili?: string
  alamat_domisili?: string

  // Pemeriksaan
  berat_badan: number
  tinggi_badan: number
  imt: number
  hasil_status_gizi: string

  // Faktor Risiko & Gejala
  riwayat_kontak_tbc: string
  pernah_tbc: string
  kekurangan_gizi: string
  merokok: string
  riwayat_dm: string
  odha: string
  batuk: string
  bb_turun: string
  demam: string
  berkeringat: string
  pembesaran_kelenjar: string

  // Hasil
  hasil_skrining: string
  dilakukan_cxr: string
  terduga_tbc: string

  // Admin
  catatan_petugas?: string
  approved_by?: string
  approved_at?: string
  submitted_at?: string
}
