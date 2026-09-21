import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { screeningSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validasi data
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
    const { data: inserted, error } = await db
      .from('screenings')
      .insert([{
        ...data,
        status: 'pending',
        unit_pelaksana: 'Puskesmas Tanjungwangi',
        nama_kegiatan: 'Skrining Oleh Fasyankes',
      }])
      .select('id')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 })
    }

    return NextResponse.json({ id: inserted.id, message: 'Data berhasil disimpan' }, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Endpoint untuk admin mendapatkan semua data
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
