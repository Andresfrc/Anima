import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware de autenticación — Next.js lo ejecuta en cada request.
//
// ENDURECIMIENTO (auditoría C2): antes solo se comprobaba la PRESENCIA de la
// cookie `anima_admin_token`. Ahora validamos el JWT contra Supabase Auth y
// verificamos que el perfil tenga role='admin' en CADA request a una ruta
// protegida. Esto cierra la escalada de privilegios por cookie falsificada.
//
// Nota: usamos fetch directo (no @supabase/supabase-js) para ser 100% compatible
// con el runtime Edge y no inflar el bundle del middleware.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function isValidAdmin(token: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  try {
    // 1. Validar el JWT (firma + expiración) contra Supabase Auth.
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) return false
    const user = (await userRes.json()) as { id?: string }
    if (!user?.id) return false

    // 2. Verificar el rol real en `profiles` (bajo RLS, con el token del usuario).
    const profRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } },
    )
    if (!profRes.ok) return false
    const rows = (await profRes.json()) as { role?: string }[]
    return rows?.[0]?.role === 'admin'
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Recursos estáticos y API se ignoran.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const adminToken = request.cookies.get('anima_admin_token')?.value

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')

  // Validamos el token solo si existe (evita un fetch innecesario sin cookie).
  const authed = adminToken ? await isValidAdmin(adminToken) : false

  // Ruta protegida sin sesión válida → login (y limpiamos la cookie si era inválida).
  if (!authed && !isAuthPage) {
    const res = NextResponse.redirect(new URL('/login', request.url))
    if (adminToken) res.cookies.delete('anima_admin_token')
    return res
  }

  // Sesión válida intentando ir a una página de auth → dashboard.
  if (authed && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Rutas que el middleware escucha
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
}
