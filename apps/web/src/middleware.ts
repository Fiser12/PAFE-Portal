import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  try {
    const response = await fetch(new URL('/api/portal-access', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Access check: ${response.status}`)
    const access = await response.json()
    if (access.tecnico !== true) {
      return new NextResponse('Acceso reservado al equipo técnico', {
        status: 403,
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }
    const result = NextResponse.next()
    result.headers.set('Cache-Control', 'private, no-store')
    return result
  } catch (error) {
    console.error('[portal-access] No se pudo comprobar el acceso', error)
    return new NextResponse('No se pudo comprobar el acceso', { status: 503 })
  }
}

export const config = {
  matcher: ['/wiki/:path*', '/catalog/:path*'],
}
