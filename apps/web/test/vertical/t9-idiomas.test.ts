/** T12: el contenido se escribe en castellano y en euskera */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createItem, createStaff } from './helpers/factory'
import { at } from './helpers/dates'
import { publicarNoticia } from '@/modules/tablon/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('catálogo en dos idiomas', () => {
  it('un material guarda título distinto en cada idioma', async () => {
    const material = await createItem(payload, { title: 'Cuentos para dormir' })

    await payload.update({
      collection: 'catalog-item',
      id: material.id,
      locale: 'eu',
      data: { title: 'Ipuinak lotarako' },
      overrideAccess: true,
    })

    const enEuskera = await payload.findByID({
      collection: 'catalog-item',
      id: material.id,
      locale: 'eu',
      overrideAccess: true,
    })
    const enCastellano = await payload.findByID({
      collection: 'catalog-item',
      id: material.id,
      locale: 'es',
      overrideAccess: true,
    })

    expect(enEuskera.title).toBe('Ipuinak lotarako')
    expect(enCastellano.title).toBe('Cuentos para dormir')
  })

  it('si falta el euskera, se ve el castellano en su lugar', async () => {
    const material = await createItem(payload, { title: 'Solo en castellano' })

    const enEuskera = await payload.findByID({
      collection: 'catalog-item',
      id: material.id,
      locale: 'eu',
      overrideAccess: true,
    })

    expect(enEuskera.title).toBe('Solo en castellano')
  })

  it('las categorías del filtro también se traducen', async () => {
    const termino = await payload.create({
      collection: 'taxonomy',
      data: { name: 'Emociones y regulación', slug: `emociones-${Date.now()}` },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'taxonomy',
      id: termino.id,
      locale: 'eu',
      data: { name: 'Emozioak eta erregulazioa' },
      overrideAccess: true,
    })

    const eu = await payload.findByID({
      collection: 'taxonomy',
      id: termino.id,
      locale: 'eu',
      overrideAccess: true,
    })
    expect(eu.name).toBe('Emozioak eta erregulazioa')
  })
})

describe('tablón en dos idiomas', () => {
  it('una noticia guarda título distinto en cada idioma', async () => {
    const staff = await createStaff(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Orden del día',
      body: '.',
      area: 'berriak-pafe',
      now: at('2026-09-16'),
    })

    await payload.update({
      collection: 'noticia',
      id: noticia.id,
      locale: 'eu',
      data: { title: 'Gai-zerrenda' },
      overrideAccess: true,
      context: { saltarAvisoDelTablon: true },
    })

    const eu = await payload.findByID({
      collection: 'noticia',
      id: noticia.id,
      locale: 'eu',
      overrideAccess: true,
    })
    expect(eu.title).toBe('Gai-zerrenda')
  })

  it('lo que responde la gente no se traduce: va como lo escribió', async () => {
    const { responder, respuestasDe } = await import('@/modules/tablon/services')
    const staff = await createStaff(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Para responder',
      body: '.',
      area: 'berriak-pafe',
      now: at('2026-09-16'),
    })

    await responder({
      payload,
      user: staff,
      noticiaId: Number(noticia.id),
      mensaje: 'Ze polita!!!',
    })

    const enCastellano = await respuestasDe({
      payload,
      user: staff,
      noticiaId: Number(noticia.id),
    })
    expect(enCastellano[0]!.mensaje).toBe('Ze polita!!!')
  })
})
