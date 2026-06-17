import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware de autenticación — Next.js lo ejecuta en cada request
export function proxy(request: NextRequest) {
  const adminToken = request.cookies.get('anima_admin_token')?.value

  // Rutas públicas (no requieren sesión)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');

  // Recursos estáticos y API se ignoran
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Sin token + ruta protegida → redirigir a login
  if (!adminToken && !isAuthPage) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Con token + intenta ir a login/register → redirigir al dashboard
  if (adminToken && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Rutas que el middleware escucha
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
}
