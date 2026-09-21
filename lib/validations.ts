import { z } from 'zod'

const opsiYaTidak = ['Ya', 'Tidak'] as const
const opsiGejalaTidak = ['Tidak Ada', 'Ada'] as const

export const screeningSchema = z.object({
  // Step 1 - Identitas
  tanggal_skrining: z.string().min(1, 'Tanggal skrining wajib diisi'),
  nama_kegiatan: z.string().default('Skrining Oleh Fasyankes'),
  tempat_skrining: z.string().min(1, 'Tempat skrining wajib diisi'),
  kewarganegaraan: z.string().default('WNI'),
  nik: z.string().length(16, 'NIK harus 16 digit').regex(/^\d+$/, 'NIK hanya angka'),
  nama_peserta: z.string().min(3, 'Nama minimal 3 karakter'),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan'], { message: 'Pilih jenis kelamin' }),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  pekerjaan: z.string().min(1, 'Pekerjaan wajib diisi'),
  no_hp: z.string().optional(),

  // Step 2 - Alamat
  provinsi_ktp: z.string().default('Jawa Barat'),
  kabupaten_ktp: z.string().default('Kabupaten Subang'),
  kecamatan_ktp: z.string().default('Cijambe'),
  kelurahan_ktp: z.string().min(1, 'Kelurahan / Desa wajib dipilih'),
  alamat_ktp: z.string().min(5, 'Alamat lengkap wajib diisi'),
  sama_dengan_ktp: z.enum(['Ya', 'Tidak']).default('Ya'),
  provinsi_domisili: z.string().optional(),
  kabupaten_domisili: z.string().optional(),
  kecamatan_domisili: z.string().optional(),
  kelurahan_domisili: z.string().optional(),
  alamat_domisili: z.string().optional(),

  // Step 3 - Pemeriksaan Fisik
  berat_badan: z.coerce.number().min(1, 'Berat badan wajib diisi').max(300),
  tinggi_badan: z.coerce.number().min(1, 'Tinggi badan wajib diisi').max(300),
  hasil_status_gizi: z.string().optional(),
  riwayat_kontak_tbc: z.string().min(1, 'Wajib diisi'),
  pernah_tbc: z.string().min(1, 'Wajib diisi'),
  kekurangan_gizi: z.string().min(1, 'Wajib diisi'),
  merokok: z.string().min(1, 'Wajib diisi'),
  riwayat_dm: z.string().min(1, 'Wajib diisi'),
  odha: z.string().min(1, 'Wajib diisi'),

  // Step 4 - Gejala
  batuk: z.string().min(1, 'Wajib diisi'),
  bb_turun: z.string().min(1, 'Wajib diisi'),
  demam: z.string().min(1, 'Wajib diisi'),
  berkeringat: z.string().min(1, 'Wajib diisi'),
  pembesaran_kelenjar: z.string().min(1, 'Wajib diisi'),
  hasil_skrining: z.string().optional().default('Bukan Suspek TBC'),
  dilakukan_cxr: z.string().optional().default('Tidak'),
  terduga_tbc: z.string().optional().default('Tidak'),
  keterangan: z.string().optional().default('Tracing TB 2026'),
})

export type ScreeningFormData = z.infer<typeof screeningSchema>

// Opsi dropdown 5 Desa di Wilayah Kerja Puskesmas Tanjungwangi
export const OPSI_DESA = [
  'Desa Tanjungwangi',
  'Desa Gunung Tua',
  'Desa Cijambe',
  'Desa Bantarsari',
  'Desa Sukahurip',
] as const

export const OPSI_TEMPAT = [
  'Desa Tanjungwangi',
  'Desa Gunung Tua',
  'Desa Cijambe',
  'Desa Bantarsari',
  'Desa Sukahurip',
] as const

export const OPSI_PEKERJAAN = [
  'Tidak Bekerja', 'Petani/Pekebun', 'Nelayan', 'Pedagang',
  'Pegawai Negeri Sipil', 'TNI/Polri', 'Pegawai Swasta',
  'Wiraswasta', 'Ibu Rumah Tangga', 'Pelajar/Mahasiswa',
  'Buruh Harian Lepas', 'Lainnya'
]

export const OPSI_YA_TIDAK = ['Ya', 'Tidak']

export const OPSI_GEJALA = ['Tidak Ada', 'Ada', 'Tidak Diketahui']

export const OPSI_HASIL_GIZI = [
  'Normal', 'Kurang', 'Lebih', 'Obesitas', 'Sangat Kurang'
]

export const OPSI_HASIL_SKRINING = [
  'Suspek TBC', 'Bukan Suspek TBC', 'Perlu Pemeriksaan Lanjut'
]

export const OPSI_CXR = ['Ya', 'Tidak']

export const OPSI_TERDUGA_TBC = ['Ya', 'Tidak', 'Tidak Dapat Dinilai']

export const OPSI_KONTAK = ['Ya', 'Tidak', 'Tidak Diketahui']

export const PROVINSI_LIST = [
  'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta',
  'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
  'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah',
  'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung',
  'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya',
  'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah', 'Riau',
  'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara',
  'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara'
]
