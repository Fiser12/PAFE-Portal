import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

// Wiki y catálogo no se sirven sin sesión abierta: la wiki son destilados de
// obras con copyright, y el catálogo es material interno de PAFE.
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/wiki/:path*', '/catalog/:path*'],
}
