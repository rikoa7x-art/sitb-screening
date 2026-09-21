import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = supabaseAdmin()
    const { data, error } = await db
      .from('screenings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, catatan_petugas, approved_by } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const updateData: Record<string, unknown> = {
      status: action === 'approve' ? 'approved' : 'rejected',
      catatan_petugas,
      approved_by,
      approved_at: new Date().toISOString(),
    }

    const { data, error } = await db
      .from('screenings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Gagal mengupdate status' }, { status: 500 })
    }

    return NextResponse.json({ message: `Data ${action === 'approve' ? 'disetujui' : 'ditolak'}`, data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
