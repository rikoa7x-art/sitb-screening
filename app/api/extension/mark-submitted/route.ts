import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyExtensionKey } from '@/lib/auth'

/**
 * PATCH /api/extension/mark-submitted
 * 
 * Endpoint khusus untuk Chrome Extension agar dapat mengupdate
 * status skrining menjadi 'submitted' tanpa menggunakan Service Role Key
 * langsung dari browser.
 * 
 * Autentikasi: X-Extension-Key header harus cocok dengan
 * environment variable EXTENSION_SECRET_KEY.
 */
export async function PATCH(req: NextRequest) {
  // Verifikasi extension secret key
  if (!verifyExtensionKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const { error } = await db
      .from('screenings')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'approved') // Hanya bisa update dari status approved

    if (error) {
      console.error('Mark submitted error:', error)
      return NextResponse.json({ error: 'Gagal mengupdate status' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
