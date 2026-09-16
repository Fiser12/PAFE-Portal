import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

// La wiki son destilados de obras con copyright: no se sirve sin sesión abierta.
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/wiki/:path*'],
}
