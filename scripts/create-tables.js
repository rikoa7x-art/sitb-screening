/**
 * Setup Database via direct PostgreSQL connection ke Supabase
 * Jalankan: node scripts/create-tables.js
 */

const postgres = require('postgres')
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

// Extract project ref dari URL
const projectRef = env.NEXT_PUBLIC_SUPABASE_URL
  .replace('https://', '')
  .replace('.supabase.co', '')

// Connection string Supabase (transaction pooler port 6543)
const connectionString = `postgresql://postgres.${projectRef}:${env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

async function main() {
  console.log('\n🗄️  Setup Database Supabase via Direct Connection...\n')

  let sql
  try {
    sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  } catch (e) {
    console.error('❌ Gagal connect:', e.message)
    process.exit(1)
  }

  try {
    // Test koneksi
    await sql`SELECT 1`
    console.log('✅ Koneksi berhasil!\n')

    // Baca dan jalankan SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'setup-db.sql'), 'utf-8')
    
    console.log('⏳ Membuat tabel...')
    await sql.unsafe(sqlFile)
    console.log('✅ Tabel berhasil dibuat!\n')

    // Verifikasi
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'screenings'`
    if (result.length > 0) {
      console.log('✅ SELESAI! Tabel screenings siap digunakan.')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Gunakan cara alternatif - jalankan SQL manual di Supabase:')
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`)
  } finally {
    await sql.end()
  }
}

main()
