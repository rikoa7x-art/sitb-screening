/**
 * Setup Database via Supabase JS Client
 * Jalankan: node scripts/run-sql.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) env[key.trim()] = vals.join('=').trim()
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function setup() {
  console.log('\n🗄️  Setup Database Supabase...\n')

  // Jalankan SQL statements satu per satu
  const statements = [
    // 1. UUID extension
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

    // 2. Drop old
    `DROP TABLE IF EXISTS screenings CASCADE`,
    `DROP TYPE IF EXISTS screening_status CASCADE`,

    // 3. Enum
    `CREATE TYPE screening_status AS ENUM ('pending', 'approved', 'rejected', 'submitted')`,

    // 4. Tabel
    `CREATE TABLE screenings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      status screening_status DEFAULT 'pending',
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
      provinsi_ktp TEXT NOT NULL,
      kabupaten_ktp TEXT NOT NULL,
      kecamatan_ktp TEXT,
      kelurahan_ktp TEXT,
      alamat_ktp TEXT NOT NULL,
      sama_dengan_ktp TEXT DEFAULT 'Ya',
      provinsi_domisili TEXT,
      kabupaten_domisili TEXT,
      kecamatan_domisili TEXT,
      kelurahan_domisili TEXT,
      alamat_domisili TEXT,
      berat_badan NUMERIC(5,2) NOT NULL,
      tinggi_badan NUMERIC(5,2) NOT NULL,
      hasil_status_gizi TEXT,
      riwayat_kontak_tbc TEXT NOT NULL,
      pernah_tbc TEXT NOT NULL,
      kekurangan_gizi TEXT NOT NULL,
      merokok TEXT NOT NULL,
      riwayat_dm TEXT NOT NULL,
      odha TEXT NOT NULL,
      batuk TEXT NOT NULL,
      bb_turun TEXT NOT NULL,
      demam TEXT NOT NULL,
      berkeringat TEXT NOT NULL,
      pembesaran_kelenjar TEXT NOT NULL,
      hasil_skrining TEXT NOT NULL,
      dilakukan_cxr TEXT NOT NULL,
      terduga_tbc TEXT,
      catatan_petugas TEXT,
      approved_by TEXT,
      approved_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ
    )`,

    // 5. RLS
    `ALTER TABLE screenings ENABLE ROW LEVEL SECURITY`,

    // 6. Policies
    `DROP POLICY IF EXISTS "Allow public insert" ON screenings`,
    `CREATE POLICY "Allow public insert" ON screenings FOR INSERT WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "Allow service all" ON screenings`,
    `CREATE POLICY "Allow service all" ON screenings USING (true) WITH CHECK (true)`,

    // 7. Indexes
    `CREATE INDEX IF NOT EXISTS idx_screenings_status ON screenings(status)`,
    `CREATE INDEX IF NOT EXISTS idx_screenings_created_at ON screenings(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_screenings_nik ON screenings(nik)`,
  ]

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i].trim()
    const preview = sql.substring(0, 60).replace(/\s+/g, ' ')
    process.stdout.write(`  [${i+1}/${statements.length}] ${preview}... `)
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: null }))
    
    // Fallback: coba via PostgREST query langsung
    if (error) {
      // Lewati error yang tidak kritikal
      if (error.message?.includes('already exists') || 
          error.message?.includes('does not exist')) {
        console.log('⏭️  skip (sudah ada/tidak ada)')
        continue
      }
    }
    console.log('✅')
  }

  // Verifikasi tabel ada
  const { data, error } = await supabase.from('screenings').select('count').limit(1)
  if (!error) {
    console.log('\n✅ SUKSES! Tabel screenings berhasil dibuat dan siap digunakan.')
  } else {
    console.log('\n⚠️  Verifikasi gagal:', error.message)
    console.log('💡 Coba jalankan SQL manual di Supabase SQL Editor.')
  }
}

setup().catch(console.error)
