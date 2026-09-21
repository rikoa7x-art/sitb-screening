/**
 * Setup Database Supabase
 * Jalankan: node scripts/setup-db.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// Load .env.local manual
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) env[key.trim()] = vals.join('=').trim()
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

// Extract project ref dari URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

console.log(`\n🗄️  Setup Database Supabase`)
console.log(`📋 Project: ${projectRef}\n`)

const sql = fs.readFileSync(path.join(__dirname, 'setup-db.sql'), 'utf-8')

const data = JSON.stringify({ query: sql })

const options = {
  hostname: `${projectRef}.supabase.co`,
  path: `/rest/v1/`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  }
}

// Gunakan Management API
const mgmtOptions = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Length': Buffer.byteLength(data)
  }
}

const req = https.request(mgmtOptions, (res) => {
  let body = ''
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Database setup berhasil!')
      console.log('   Tabel screenings telah dibuat.')
    } else {
      console.error(`❌ Error ${res.statusCode}: ${body}`)
      console.log('\n💡 Coba jalankan SQL manual di:')
      console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql`)
    }
  })
})

req.on('error', (e) => {
  console.error('❌ Request error:', e.message)
  console.log('\n💡 Setup manual:')
  console.log(`   1. Buka: https://supabase.com/dashboard/project/${projectRef}/sql`)
  console.log(`   2. Copy-paste isi file: scripts/setup-db.sql`)
  console.log(`   3. Klik Run`)
})

req.write(data)
req.end()
