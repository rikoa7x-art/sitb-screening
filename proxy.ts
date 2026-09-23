import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { COOKIE_NAME } from '@/lib/auth'

/**
 * Middleware Next.js untuk melindungi:
 * - /admin/dashboard/* → redirect ke /admin jika belum login
 * - /api/screening/*   → return 401 jika belum login
 * 
 * Route publik yang TIDAK diproteksi:
 * - GET/POST /api/screening (POST = submit form warga)  ← dihandle di route itu sendiri
 * - /admin (halaman login)
 * - / (form warga)
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Proteksi halaman dashboard admin ────────────────────────────────────────
  if (pathname.startsWith('/admin/dashboard')) {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token || !(await isValidToken(token))) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ── Proteksi API admin (GET list, PATCH, DELETE) ─────────────────────────
  // POST ke /api/screening (submit warga) dibiarkan publik
  // GET ke /api/screening diproteksi (hanya admin boleh list data)
  if (pathname.startsWith('/api/screening')) {
    const method = req.method
    // POST dari warga boleh tanpa auth
    if (method === 'POST' && pathname === '/api/screening') {
      return NextResponse.next()
    }
    // Semua lainnya (GET list, GET detail, PATCH, DELETE) wajib auth
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token || !(await isValidToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

/** Verifikasi JWT token via Supabase */
async function isValidToken(token: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.getUser(token)
    return !error && !!data.user
  } catch {
    return false
  }
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/api/screening/:path*',
    '/api/screening',
  ],
}
