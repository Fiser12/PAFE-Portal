/** T1/T2: publicar en el tablón y leerlo. Reglas R1–R4, R6 de la spec */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createPendiente, createStaff } from './helpers/factory'
import { at } from './helpers/dates'
import { noticiaDelTablon, noticiasDelTablon, publicarNoticia } from '@/modules/tablon/services'

const AREA = 'berriak-pafe'
const OTRA = 'partekatutako-berriak'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

// Las áreas son fijas, así que sin esto cada test vería lo que publicó el anterior
beforeEach(async () => {
  await payload.delete({ collection: 'noticia', where: {}, overrideAccess: true })
})

const expectTablonError = (p: Promise<unknown>, code: string) =>
  expect(p).rejects.toMatchObject({ code })

const titulos = async (user: Awaited<ReturnType<typeof createFamilia>>, area?: string) =>
  (await noticiasDelTablon({ payload, user, area, now: at('2026-09-20') })).map((n) => n.title)

describe('publicar y leer el tablón', () => {
  it('el staff publica y la noticia aparece en el tablón', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await publicarNoticia({
      payload,
      user: staff,
      title: 'Reunión del martes',
      body: 'Empezamos a las 17:00.',
      area: AREA,
      now: at('2026-09-16'),
    })

    expect(await titulos(familia, AREA)).toContain('Reunión del martes')
  })

  it('las fijadas van primero y el resto por fecha descendente', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const publicar = (title: string, dia: string, pinned = false) =>
      publicarNoticia({
        payload,
        user: staff,
        title,
        body: title,
        area: AREA,
        pinned,
        now: at(dia),
      })

    await publicar('Antigua', '2026-09-10')
    await publicar('Reciente', '2026-09-15')
    await publicar('Fijada', '2026-09-01', true)

    expect(await titulos(familia, AREA)).toEqual(['Fijada', 'Reciente', 'Antigua'])
  })

  it('una noticia con fecha futura todavía no se ve', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await publicarNoticia({
      payload,
      user: staff,
      title: 'Fiesta de fin de curso',
      body: 'Reservad la fecha.',
      area: AREA,
      publishedAt: at('2026-10-30').toISOString(),
      now: at('2026-09-16'),
    })

    expect(await titulos(familia, AREA)).toEqual([])
  })

  it('el filtro por área deja fuera las demás', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await publicarNoticia({
      payload,
      user: staff,
      title: 'Solo para avisos',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    expect(await titulos(familia, OTRA)).toEqual([])
    expect(await titulos(familia, AREA)).toContain('Solo para avisos')
  })

  it('una familia no puede publicar', async () => {
    const familia = await createFamilia(payload)
    await expectTablonError(
      publicarNoticia({
        payload,
        user: familia,
        title: 'No debería',
        body: '.',
        area: AREA,
        now: at('2026-09-16'),
      }),
      'sin-permiso',
    )
  })

  it('quien no tiene rol no ve el tablón', async () => {
    const pendiente = await createPendiente(payload)

    await expectTablonError(
      noticiasDelTablon({ payload, user: pendiente, now: at('2026-09-20') }),
      'sin-permiso',
    )
  })
})

describe('abrir una noticia por su URL', () => {
  it('una noticia publicada se abre', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Ya publicada',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    const abierta = await noticiaDelTablon({
      payload,
      user: familia,
      id: noticia.id,
      now: at('2026-09-20'),
    })
    expect(abierta?.title).toBe('Ya publicada')
  })

  it('una noticia programada no se abre antes de tiempo, ni sabiendo su id', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Secreto hasta octubre',
      body: 'Lo que no debe verse todavía.',
      area: AREA,
      publishedAt: at('2026-10-30').toISOString(),
      now: at('2026-09-16'),
    })

    const abierta = await noticiaDelTablon({
      payload,
      user: familia,
      id: noticia.id,
      now: at('2026-09-20'),
    })
    expect(abierta).toBeNull()
  })

  it('el staff sí puede abrir lo que tiene programado', async () => {
    const staff = await createStaff(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Borrador programado',
      body: '.',
      area: AREA,
      publishedAt: at('2026-10-30').toISOString(),
      now: at('2026-09-16'),
    })

    const abierta = await noticiaDelTablon({
      payload,
      user: staff,
      id: noticia.id,
      now: at('2026-09-20'),
    })
    expect(abierta?.title).toBe('Borrador programado')
  })

  it('el tablón no lleva al navegador los datos de quien publica', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await publicarNoticia({
      payload,
      user: staff,
      title: 'Con autoría',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    const noticias = await noticiasDelTablon({
      payload,
      user: familia,
      area: AREA,
      now: at('2026-09-20'),
    })
    expect(JSON.stringify(noticias)).not.toContain(staff.email)
  })
})
