/** T16: en el panel, ver la noticia mientras se escribe y volver al portal desde cualquier pantalla */
import { beforeAll, describe, expect, it } from 'vitest'
import { createLocalReq, type Payload } from 'payload'
import { getTestPayload } from './helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('vista previa de una noticia', () => {
  const urlDe = async (data: Record<string, unknown>, locale = 'es') => {
    const { livePreview } = payload.collections.noticia.config.admin
    if (typeof livePreview?.url !== 'function') throw new Error('la noticia no tiene vista previa')
    return livePreview.url({
      collectionConfig: payload.collections.noticia.config,
      data,
      locale: { code: locale, label: locale },
      payload,
      req: await createLocalReq({}, payload),
    })
  }

  it('se ve en el portal la noticia que se está editando', async () => {
    expect(await urlDe({ id: 12, title: 'Reunión' })).toBe('/noticias/vista-previa?id=12&locale=es')
  })

  it('una noticia nueva, aún sin guardar, también se ve', async () => {
    expect(await urlDe({ title: 'Borrador' })).toBe('/noticias/vista-previa?locale=es')
  })

  it('en el idioma que se está escribiendo', async () => {
    expect(await urlDe({ id: 12 }, 'eu')).toBe('/noticias/vista-previa?id=12&locale=eu')
  })
})

describe('volver al portal desde el panel', () => {
  it('el botón está en la cabecera de todas las pantallas del panel', () => {
    expect(payload.config.admin.components?.actions).toContainEqual(
      '@/components/admin/VolverAlPortal',
    )
  })
})
