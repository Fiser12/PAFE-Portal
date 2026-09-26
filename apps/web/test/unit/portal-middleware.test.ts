import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

vi.mock('better-auth/cookies', () => ({
  getSessionCookie: (request: NextRequest) =>
    request.cookies.get('better-auth.session_token')?.value,
}))
afterEach(() => vi.unstubAllGlobals())
const request = (path: string, cookie = '') =>
  new NextRequest(`http://localhost:3000${path}`, { headers: { cookie } })

describe('protección de Wiki y Catálogo', () => {
  it('requiere iniciar sesión incluso para un archivo de la wiki', async () => {
    expect(
      (await middleware(request('/wiki/static/contentIndex.json'))).headers.get('location'),
    ).toBe('http://localhost:3000/login')
  })
  it('rechaza cookies inventadas y usuarios sin permiso en lugar de servir HTML o archivos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => Response.json({ tecnico: false })),
    )
    for (const path of [
      '/wiki',
      '/wiki/index.html',
      '/wiki/static/contentIndex.json',
      '/catalog/1',
    ]) {
      expect((await middleware(request(path, 'better-auth.session_token=falsa'))).status).toBe(403)
    }
  })
  it('permite la respuesta únicamente tras verificar el permiso y evita caché compartida', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ tecnico: true }))
    vi.stubGlobal('fetch', fetcher)
    const response = await middleware(request('/wiki/libros', 'better-auth.session_token=sesion'))
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(fetcher).toHaveBeenCalledWith(
      new URL('http://localhost:3000/api/portal-access'),
      expect.objectContaining({
        cache: 'no-store',
        headers: { cookie: 'better-auth.session_token=sesion' },
      }),
    )
  })
  it('un fallo al verificar acceso no abre la wiki', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await middleware(request('/wiki', 'better-auth.session_token=sesion'))).status).toBe(
      503,
    )
    log.mockRestore()
  })
})
