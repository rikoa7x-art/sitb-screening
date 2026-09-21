/**
 * SITB Auto-fill Script
 * 
 * Script Playwright untuk mengisi form SITB secara otomatis
 * berdasarkan data yang sudah disetujui di Supabase.
 * 
 * PENGGUNAAN:
 *   npx ts-node playwright/sitb-autofill.ts --id <uuid-screening>
 * 
 * REQUIREMENTS:
 *   - File .env.local harus ada dengan kredensial Supabase
 *   - File .env.sitb harus ada dengan kredensial SITB petugas
 *   - Jalankan: npx playwright install chromium
 */

import { chromium, Browser, Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.sitb' })

// =============================================
// KONFIGURASI SITB
// =============================================
const SITB_CONFIG = {
  URL: process.env.SITB_URL || 'https://sitb.kemkes.go.id',
  USERNAME: process.env.SITB_USERNAME || '',
  PASSWORD: process.env.SITB_PASSWORD || '',
  PUSKESMAS_ID: process.env.SITB_PUSKESMAS_ID || '',
}

// =============================================
// SUPABASE CLIENT
// =============================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =============================================
// TIPE DATA
// =============================================
interface ScreeningData {
  id: string
  status: string
  tanggal_skrining: string
  nik: string
  nama_peserta: string
  jenis_kelamin: string
  tanggal_lahir: string
  umur: number
  pekerjaan: string
  no_hp: string
  provinsi_ktp: string
  kabupaten_ktp: string
  kecamatan_ktp: string
  kelurahan_ktp: string
  alamat_ktp: string
  sama_dengan_ktp: string
  berat_badan: number
  tinggi_badan: number
  imt: number
  hasil_status_gizi: string
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
  hasil_skrining: string
  dilakukan_cxr: string
  terduga_tbc: string
}

// =============================================
// HELPER: Select dropdown by visible text
// =============================================
async function selectByText(page: Page, selector: string, text: string) {
  try {
    await page.selectOption(selector, { label: text })
  } catch {
    // Fallback: coba cari option yang mengandung teks
    await page.evaluate(({ selector, text }) => {
      const select = document.querySelector(selector) as HTMLSelectElement
      if (!select) return
      const options = Array.from(select.options)
      const opt = options.find(o => o.text.toLowerCase().includes(text.toLowerCase()))
      if (opt) select.value = opt.value
    }, { selector, text })
  }
}

// =============================================
// HELPER: Screenshot
// =============================================
async function screenshot(page: Page, name: string, screenshotDir: string) {
  const filePath = path.join(screenshotDir, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
  console.log(`  📸 Screenshot: ${filePath}`)
}

// =============================================
// MAIN: Login ke SITB
// =============================================
async function loginSITB(page: Page) {
  console.log('🔐 Login ke SITB...')
  
  await page.goto(`${SITB_CONFIG.URL}/login`, { waitUntil: 'networkidle' })
  
  // Isi form login SITB
  await page.fill('input[name="username"], input[type="email"], #username', SITB_CONFIG.USERNAME)
  await page.fill('input[name="password"], input[type="password"], #password', SITB_CONFIG.PASSWORD)
  await page.click('button[type="submit"], input[type="submit"], .btn-login')
  
  // Tunggu redirect
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 })
  
  const url = page.url()
  if (url.includes('login')) {
    throw new Error('Login gagal — periksa username/password SITB')
  }
  
  console.log('  ✅ Login berhasil')
}

// =============================================
// MAIN: Navigasi ke form Tambah Skrining
// =============================================
async function navigateToSkriningForm(page: Page) {
  console.log('📋 Navigasi ke form skrining...')
  
  // Navigasi ke menu skrining
  await page.goto(`${SITB_CONFIG.URL}/skrining/tambah`, { waitUntil: 'networkidle' })
  
  // Atau klik via menu navigasi
  // await page.click('a:has-text("Skrining")')
  // await page.click('a:has-text("Tambah")')
  
  await page.waitForSelector('form', { timeout: 10000 })
  console.log('  ✅ Form skrining ditemukan')
}

// =============================================
// MAIN: Isi form SITB dengan data
// =============================================
async function fillSITBForm(page: Page, data: ScreeningData, screenshotDir: string) {
  console.log('✍️  Mengisi form SITB...')

  // ── IDENTITAS ──────────────────────────────
  console.log('  → Identitas Diri...')

  // Tanggal Skrining
  const tglFormatted = new Date(data.tanggal_skrining).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  try {
    await page.fill('input[name="tanggal_pelaksanaan"], #tanggal_skrining', data.tanggal_skrining)
  } catch { /* field mungkin menggunakan datepicker custom */ }

  // Nama Kegiatan
  await selectByText(page, 'select[name="nama_kegiatan"], #nama_kegiatan', 'Skrining Oleh Fasyankes')

  // Tempat Skrining
  try {
    await selectByText(page, 'select[name="tempat_skrining"], #tempat_skrining', 'Puskesmas')
  } catch {}

  // Kewarganegaraan
  await selectByText(page, 'select[name="kewarganegaraan"], #kewarganegaraan', 'WNI')

  // NIK
  await page.fill('input[name="nik"], #nik', data.nik)

  // Nama Peserta
  await page.fill('input[name="nama_peserta"], input[name="nama"], #nama_peserta', data.nama_peserta)

  // Jenis Kelamin
  await selectByText(page, 'select[name="jenis_kelamin"], #jenis_kelamin', data.jenis_kelamin)

  // Tanggal Lahir
  await page.fill('input[name="tanggal_lahir"], #tanggal_lahir', data.tanggal_lahir)

  // Pekerjaan
  await selectByText(page, 'select[name="pekerjaan"], #pekerjaan', data.pekerjaan)

  // No HP
  if (data.no_hp) {
    await page.fill('input[name="no_hp"], input[name="no_telp"], #no_hp', data.no_hp).catch(() => {})
  }

  await screenshot(page, '01_identitas', screenshotDir)

  // ── ALAMAT KTP ────────────────────────────────
  console.log('  → Alamat KTP...')

  await selectByText(page, 'select[name="provinsi_ktp"], #provinsi_ktp', data.provinsi_ktp).catch(() => {})
  await page.waitForTimeout(500)
  
  await selectByText(page, 'select[name="kabupaten_ktp"], #kabupaten_ktp', data.kabupaten_ktp).catch(() => {})
  await page.waitForTimeout(500)
  
  await selectByText(page, 'select[name="kecamatan_ktp"], #kecamatan_ktp', data.kecamatan_ktp).catch(() => {})
  await page.waitForTimeout(500)
  
  await selectByText(page, 'select[name="kelurahan_ktp"], #kelurahan_ktp', data.kelurahan_ktp).catch(() => {})
  
  await page.fill('textarea[name="alamat_ktp"], input[name="alamat_ktp"], #alamat_ktp', data.alamat_ktp).catch(() => {})

  // Alamat Domisili sama dengan KTP?
  await selectByText(page, 'select[name="sama_dengan_ktp"], #sama_dengan_ktp', data.sama_dengan_ktp).catch(() => {})

  await screenshot(page, '02_alamat', screenshotDir)

  // ── PEMERIKSAAN BB/TB ─────────────────────────
  console.log('  → Pemeriksaan Berat & Tinggi Badan...')

  await page.fill('input[name="berat_badan"], #berat_badan', String(data.berat_badan)).catch(() => {})
  await page.fill('input[name="tinggi_badan"], #tinggi_badan', String(data.tinggi_badan)).catch(() => {})
  await page.waitForTimeout(300) // tunggu IMT auto-calculate
  
  if (data.hasil_status_gizi) {
    await selectByText(page, 'select[name="hasil_status_gizi"], #hasil_status_gizi', data.hasil_status_gizi).catch(() => {})
  }

  // ── RIWAYAT KONTAK TBC ─────────────────────────
  await selectByText(page, 'select[name="riwayat_kontak_tbc"], #riwayat_kontak', data.riwayat_kontak_tbc).catch(() => {})

  await screenshot(page, '03_pemeriksaan', screenshotDir)

  // ── FAKTOR RISIKO ──────────────────────────────
  console.log('  → Faktor Risiko...')

  const faktors: { field: string; value: string }[] = [
    { field: 'pernah_tbc', value: data.pernah_tbc },
    { field: 'kekurangan_gizi', value: data.kekurangan_gizi },
    { field: 'merokok', value: data.merokok },
    { field: 'riwayat_dm', value: data.riwayat_dm },
    { field: 'odha', value: data.odha },
  ]

  for (const { field, value } of faktors) {
    await selectByText(page, `select[name="${field}"], #${field}`, value).catch(() => {})
  }

  // ── GEJALA & TANDA ─────────────────────────────
  console.log('  → Gejala dan Tanda...')

  const gejala: { field: string; value: string }[] = [
    { field: 'batuk', value: data.batuk },
    { field: 'bb_turun', value: data.bb_turun },
    { field: 'demam', value: data.demam },
    { field: 'berkeringat', value: data.berkeringat },
    { field: 'pembesaran_kelenjar', value: data.pembesaran_kelenjar },
  ]

  for (const { field, value } of gejala) {
    await selectByText(page, `select[name="${field}"], #${field}`, value).catch(() => {})
  }

  await screenshot(page, '04_gejala', screenshotDir)

  // ── HASIL SKRINING ──────────────────────────────
  console.log('  → Hasil Skrining...')

  await selectByText(page, 'select[name="hasil_skrining"], #hasil_skrining', data.hasil_skrining).catch(() => {})
  await selectByText(page, 'select[name="dilakukan_cxr"], #dilakukan_cxr', data.dilakukan_cxr).catch(() => {})
  
  if (data.terduga_tbc) {
    await selectByText(page, 'select[name="terduga_tbc"], #terduga_tbc', data.terduga_tbc).catch(() => {})
  }

  await screenshot(page, '05_hasil', screenshotDir)
  console.log('  ✅ Form selesai diisi')
}

// =============================================
// MAIN: Submit form
// =============================================
async function submitForm(page: Page, screenshotDir: string) {
  console.log('📤 Mengirim form...')
  
  // Klik tombol simpan/submit
  await page.click('button[type="submit"]:has-text("Simpan"), button:has-text("Tambah"), input[type="submit"]')
  
  // Tunggu konfirmasi
  await page.waitForTimeout(2000)
  
  // Cek apakah berhasil (ada pesan sukses atau redirect)
  const successIndicators = [
    'text=berhasil',
    'text=success',
    '.alert-success',
    '.swal2-success',
  ]
  
  let submitted = false
  for (const indicator of successIndicators) {
    if (await page.locator(indicator).isVisible().catch(() => false)) {
      submitted = true
      break
    }
  }
  
  await screenshot(page, '06_submit_result', screenshotDir)
  
  if (!submitted) {
    console.warn('  ⚠️  Tidak ada konfirmasi sukses yang terdeteksi. Cek screenshot.')
  } else {
    console.log('  ✅ Form berhasil dikirim ke SITB!')
  }
  
  return submitted
}

// =============================================
// MAIN FUNCTION
// =============================================
async function main() {
  // Parse arguments
  const args = process.argv.slice(2)
  const idIndex = args.indexOf('--id')
  
  if (idIndex === -1 || !args[idIndex + 1]) {
    console.error('❌ Penggunaan: npx ts-node playwright/sitb-autofill.ts --id <uuid>')
    process.exit(1)
  }
  
  const screeningId = args[idIndex + 1]
  console.log(`\n🚀 SITB Auto-fill`)
  console.log(`📋 ID Skrining: ${screeningId}\n`)

  // Validasi konfigurasi
  if (!SITB_CONFIG.USERNAME || !SITB_CONFIG.PASSWORD) {
    console.error('❌ Konfigurasi SITB tidak lengkap. Buat file .env.sitb dengan:')
    console.error('   SITB_USERNAME=username_anda')
    console.error('   SITB_PASSWORD=password_anda')
    process.exit(1)
  }

  // Ambil data dari Supabase
  console.log('📡 Mengambil data dari Supabase...')
  const { data: screening, error } = await supabase
    .from('screenings')
    .select('*')
    .eq('id', screeningId)
    .single()

  if (error || !screening) {
    console.error('❌ Data tidak ditemukan:', error?.message)
    process.exit(1)
  }

  if (screening.status !== 'approved') {
    console.error(`❌ Data belum disetujui. Status saat ini: ${screening.status}`)
    console.error('   Silakan approve dulu di admin panel.')
    process.exit(1)
  }

  console.log(`  ✅ Data ditemukan: ${screening.nama_peserta} (${screening.nik})`)

  // Buat folder screenshot
  const screenshotDir = path.join('playwright', 'screenshots', screeningId.slice(0, 8))
  fs.mkdirSync(screenshotDir, { recursive: true })

  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: false, // Tampilkan browser agar petugas bisa memantau
    slowMo: 300,     // Sedikit lambat agar mudah dipantau
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'id-ID',
  })
  const page = await context.newPage()

  try {
    // Step 1: Login
    await loginSITB(page)
    
    // Step 2: Navigasi ke form
    await navigateToSkriningForm(page)
    
    // Step 3: Isi form
    await fillSITBForm(page, screening as ScreeningData, screenshotDir)
    
    // Step 4: Submit
    const submitted = await submitForm(page, screenshotDir)

    if (submitted) {
      // Update status di Supabase
      await supabase
        .from('screenings')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', screeningId)
      
      console.log('\n✅ SELESAI! Status diupdate ke "submitted"')
      console.log(`📸 Screenshot tersimpan di: ${screenshotDir}`)
    } else {
      console.log('\n⚠️  Form mungkin belum tersubmit. Periksa browser dan screenshot.')
      console.log('   Anda dapat submit secara manual jika diperlukan.')
    }

    // Tunggu 5 detik sebelum tutup browser (beri waktu petugas melihat)
    console.log('\nBrowser akan tertutup dalam 5 detik...')
    await page.waitForTimeout(5000)

  } catch (err: any) {
    console.error('\n❌ Error:', err.message)
    await screenshot(page, 'error', screenshotDir)
    console.log(`📸 Screenshot error tersimpan di: ${screenshotDir}/error.png`)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
