/**
 * Test koneksi Supabase dan setup tabel jika belum ada
 */
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

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
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('\n🔗 Test koneksi Supabase...')
  console.log(`   URL: ${env.NEXT_PUBLIC_SUPABASE_URL}\n`)

  // Test: coba akses tabel screenings
  const { data, error } = await supabase
    .from('screenings')
    .select('id')
    .limit(1)

  if (!error) {
    console.log('✅ Tabel screenings SUDAH ADA dan koneksi OK!')
    console.log('   Aplikasi siap digunakan.\n')
    return
  }

  if (error.code === '42P01') {
    // Tabel belum ada
    console.log('⚠️  Tabel screenings belum ada.')
    console.log('📋 Silakan buat tabel manual:\n')
    console.log('   1. Buka: https://supabase.com/dashboard/project/lubgcwhrsyqvnbiutxkf/sql/new')
    console.log('   2. Copy-paste SQL berikut:\n')
    
    const sql = fs.readFileSync(path.join(__dirname, 'setup-db.sql'), 'utf-8')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    console.log('\n   3. Klik tombol Run ▶️')
    console.log('   4. Jalankan lagi: node scripts/test-db.js\n')
  } else {
    console.error('❌ Error koneksi:', error.message)
    console.log('\n   Periksa kembali:')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL di .env.local')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY di .env.local')
  }
}

main().catch(console.error)
