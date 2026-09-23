import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { Noticia } from '@/payload-types'
import { temasDelForo } from '@/modules/tablon/services'
import { GRUPO_LANTALDE } from '@/modules/tablon/domain/areas'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createPendiente, createStaff, meterEnGrupo } from './helpers/factory'

let payload: Payload
const now = new Date('2026-09-23T12:00:00Z')

beforeAll(async () => {
  payload = await getTestPayload()
})
beforeEach(async () => {
  await payload.delete({ collection: 'noticia', where: {}, overrideAccess: true })
})

const noticia = (title: string, extra: Partial<Noticia> = {}) =>
  payload.create({
    collection: 'noticia',
    data: {
      title,
      area: 'ia',
      publishedAt: '2026-09-01T12:00:00Z',
      notifiedAt: now.toISOString(),
      ...extra,
    },
    overrideAccess: true,
  })

describe('foro paginado', () => {
  it('recorre más de 50 temas sin duplicados y ordena las fijadas antes de paginar', async () => {
    const user = await createFamilia(payload)
    for (let i = 0; i < 51; i++) await noticia(`Tema ${i}`)
    const fijada = await noticia('Fijada antigua', {
      pinned: true,
      publishedAt: '2020-01-01T00:00:00Z',
    })
    const paginas = []
    for (const pagina of [1, 2, 3]) paginas.push(await temasDelForo({ payload, user, now, pagina }))
    expect(paginas[0]?.docs[0]?.id).toBe(fijada.id)
    expect(paginas.map((p) => p.docs.length)).toEqual([20, 20, 12])
    expect(new Set(paginas.flatMap((p) => p.docs.map((d) => d.id))).size).toBe(52)
    expect(paginas[0]?.totalDocs).toBe(52)
    expect((await temasDelForo({ payload, user, now, pagina: 999 })).page).toBe(3)
    expect((await temasDelForo({ payload, user, now, pagina: NaN })).page).toBe(1)
  })

  it('aplica área, búsqueda y archivo sin incluir publicaciones futuras', async () => {
    const user = await createFamilia(payload)
    await noticia('Taller actual')
    const antigua = await noticia('Taller archivado', { archivada: true })
    await noticia('Taller futuro', { publishedAt: '2030-01-01T00:00:00Z' })
    await noticia('Taller otra área', { area: 'partekatutako-berriak', archivada: true })
    const result = await temasDelForo({
      payload,
      user,
      now,
      area: 'ia',
      busqueda: 'Taller',
      archivadas: true,
    })
    expect(result.docs.map((d) => d.id)).toEqual([antigua.id])
    expect(result.totalDocs).toBe(1)
    expect((await temasDelForo({ payload, user, now, area: 'inventada' })).totalDocs).toBe(0)
  })

  it('no filtra temas ni recuentos del equipo técnico a familias ajenas al grupo', async () => {
    const user = await createFamilia(payload)
    await noticia('Reservada', { area: 'lantalde-teknikoa' })
    const result = await temasDelForo({ payload, user, now, busqueda: 'Reservada' })
    expect(result.totalDocs).toBe(0)
    expect(result.areas).not.toContain('lantalde-teknikoa')
    expect((await temasDelForo({ payload, user, now, area: 'lantalde-teknikoa' })).docs).toEqual([])
    const staff = await createStaff(payload)
    expect((await temasDelForo({ payload, user: staff, now })).totalDocs).toBe(1)

    const existentes = await payload.find({
      collection: 'groups',
      where: { name: { equals: GRUPO_LANTALDE } },
      overrideAccess: true,
    })
    const grupo =
      existentes.docs[0] ??
      (await payload.create({
        collection: 'groups',
        data: { name: GRUPO_LANTALDE },
        overrideAccess: true,
      }))
    await meterEnGrupo(payload, user.id, grupo.id)
    const miembro = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })
    expect((await temasDelForo({ payload, user: miembro, now })).totalDocs).toBe(1)
  })

  it('rechaza usuarios pendientes y respeta el idioma del contenido', async () => {
    const pendiente = await createPendiente(payload)
    await expect(temasDelForo({ payload, user: pendiente, now })).rejects.toMatchObject({
      code: 'sin-permiso',
    })
    const user = await createFamilia(payload)
    const tema = await noticia('Reunión')
    await payload.update({
      collection: 'noticia',
      id: tema.id,
      locale: 'eu',
      data: { title: 'Bilera' },
      overrideAccess: true,
    })
    const result = await temasDelForo({ payload, user, now, locale: 'eu', busqueda: 'Bilera' })
    expect(result.totalDocs).toBe(1)
    expect(result.docs[0]?.title).toBe('Bilera')
  })
})
