// Basic Auth para todo el sitio. La contraseña vive en el secret SITE_PASSWORD
// del proyecto de Cloudflare Pages (cualquier nombre de usuario es válido).
//
// La wiki reúne destilados de obras con copyright y material de trabajo interno
// de PAFE: no debe quedar abierta ni indexable. Si SITE_PASSWORD no está
// configurado, el sitio deniega el acceso en lugar de servirse en abierto.
export async function onRequest({ request, env, next }) {
  if (!env.SITE_PASSWORD) {
    return new Response(
      'SITE_PASSWORD no configurado en el proyecto de Pages: acceso denegado.',
      { status: 503 },
    )
  }

  const header = request.headers.get('Authorization') || ''
  if (header.startsWith('Basic ')) {
    try {
      const [, pass] = atob(header.slice(6)).split(/:(.*)/s)
      if (pass === env.SITE_PASSWORD) {
        const response = await next()
        // Ni buscadores ni cachés compartidas: contenido con copyright.
        const headers = new Headers(response.headers)
        headers.set('X-Robots-Tag', 'noindex, nofollow')
        headers.set('Cache-Control', 'private, no-store')
        // status y statusText se copian de forma explícita: son getters del
        // prototipo de Response, así que un spread los perdería y toda respuesta
        // saldría como 200 (las 404 de Quartz incluidas).
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      }
    } catch {
      // credenciales mal formadas: cae al 401
    }
  }

  return new Response('Autenticación requerida', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Wiki PAFE"' },
  })
}
