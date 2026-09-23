import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const COOKIE_NAME = 'admin_token'

/**
 * Verifikasi token JWT admin dari cookie request.
 * Mengembalikan user jika valid, null jika tidak.
 */
export async function verifyAdmin(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email ?? '' }
  } catch {
    return null
  }
}

/**
 * Verifikasi X-Extension-Key header untuk Chrome Extension.
 */
export function verifyExtensionKey(req: NextRequest): boolean {
  const key = req.headers.get('x-extension-key')
  const expected = process.env.EXTENSION_SECRET_KEY
  if (!expected) return false
  return key === expected
}

/** Nama cookie autentikasi admin */
export { COOKIE_NAME }
