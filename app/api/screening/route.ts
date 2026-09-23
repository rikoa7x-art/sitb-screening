import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { screeningSchema } from '@/lib/validations'

// ── Simple in-memory rate limiter ───────────────────────────────────────────
// Max 10 request per IP per menit untuk endpoint POST (submit form warga)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 menit

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true // OK
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false // Rate limit exceeded
  }

  entry.count++
  return true // OK
}

// Bersihkan map setiap 5 menit agar tidak memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60 * 1000)

// ── POST — Submit form skrining warga (publik) ───────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting berdasarkan IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()

    // Validasi data dengan Zod schema
    const parsed = screeningSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const db = supabaseAdmin()

    // Simpan ke Supabase
    const dbPayload: Record<string, unknown> = {
      ...data,
      status: 'pending',
      unit_pelaksana: 'Puskesmas Tanjungwangi',
      nama_kegiatan: 'Skrining Oleh Fasyankes',
      catatan_petugas: (data as Record<string, unknown>).catatan_petugas ?? data.keterangan ?? 'Tracing TB 2026',
    }

    let { data: inserted, error } = await db
      .from('screenings')
      .insert([dbPayload])
      .select('id')
      .single()

    // Fallback jika kolom 'keterangan' belum ada di DB (migrasi bertahap)
    if (error?.message?.includes('keterangan')) {
      delete dbPayload.keterangan
      const retry = await db
        .from('screenings')
        .insert([dbPayload])
        .select('id')
        .single()
      inserted = retry.data
      error = retry.error
    }

    if (error || !inserted) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 })
    }

    return NextResponse.json({ id: inserted.id, message: 'Data berhasil disimpan' }, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET — Daftar data skrining (admin only, diproteksi middleware) ────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const db = supabaseAdmin()
    let query = db
      .from('screenings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, total: count, page, limit })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
