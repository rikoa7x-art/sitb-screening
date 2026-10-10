import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ── GET — Daftar kelurahan/desa unik dari data skrining (admin only) ─────────
export async function GET() {
  try {
    const db = supabaseAdmin()

    const { data, error } = await db
      .from('screenings')
      .select('kelurahan_ktp')
      .not('kelurahan_ktp', 'is', null)
      .order('kelurahan_ktp', { ascending: true })

    if (error) throw error

    // Ambil nilai unik dan hilangkan yang kosong
    const desa = [...new Set(
      (data || [])
        .map((d: { kelurahan_ktp: string }) => d.kelurahan_ktp?.trim())
        .filter(Boolean)
    )].sort()

    return NextResponse.json({ desa })
  } catch (err) {
    console.error('API desa-list error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
