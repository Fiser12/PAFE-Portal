/** T1/T2: publicar en el tablón y leerlo. Reglas R1–R4, R6 de la spec */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createArea, createFamilia, createPendiente, createStaff } from './helpers/factory'
import { at } from './helpers/dates'
import { noticiaDelTablon, noticiasDelTablon, publicarNoticia } from '@/modules/tablon/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const expectTablonError = (p: Promise<unknown>, code: string) =>
  expect(p).rejects.toMatchObject({ code })

const titulos = async (user: Awaited<ReturnType<typeof createFamilia>>, areaId?: number) =>
  (await noticiasDelTablon({ payload, user, areaId, now: at('2026-09-20') })).map((n) => n.title)

describe('publicar y leer el tablón', () => {
  it('el staff publica y la noticia aparece en el tablón', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const area = await createArea(payload)

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Reunión del martes',
      body: 'Empezamos a las 17:00.',
      areaId: Number(area.id),
      now: at('2026-09-16'),
    })

    expect(await titulos(familia, Number(area.id))).toContain('Reunión del martes')
  })

  it('las fijadas van primero y el resto por fecha descendente', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const area = await createArea(payload)
    const publicar = (title: string, dia: string, pinned = false) =>
      publicarNoticia({
        payload,
        user: staff,
        title,
        body: title,
        areaId: Number(area.id),
        pinned,
        now: at(dia),
      })

    await publicar('Antigua', '2026-09-10')
    await publicar('Reciente', '2026-09-15')
    await publicar('Fijada', '2026-09-01', true)

    expect(await titulos(familia, Number(area.id))).toEqual(['Fijada', 'Reciente', 'Antigua'])
  })

  it('una noticia con fecha futura todavía no se ve', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const area = await createArea(payload)

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Fiesta de fin de curso',
      body: 'Reservad la fecha.',
      areaId: Number(area.id),
      publishedAt: at('2026-10-30').toISOString(),
      now: at('2026-09-16'),
    })

    expect(await titulos(familia, Number(area.id))).toEqual([])
  })

  it('el filtro por área deja fuera las demás', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const avisos = await createArea(payload, 'Avisos')
    const formacion = await createArea(payload, 'Formación')

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Solo para avisos',
      body: '.',
      areaId: Number(avisos.id),
      now: at('2026-09-16'),
    })

    expect(await titulos(familia, Number(formacion.id))).toEqual([])
    expect(await titulos(familia, Number(avisos.id))).toEqual(['Solo para avisos'])
  })

  it('una familia no puede publicar', async () => {
    const familia = await createFamilia(payload)
    const area = await createArea(payload)

    await expectTablonError(
      publicarNoticia({
        payload,
        user: familia,
        title: 'No debería',
        body: '.',
        areaId: Number(area.id),
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
    const area = await createArea(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Ya publicada',
      body: '.',
      areaId: Number(area.id),
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
    const area = await createArea(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Secreto hasta octubre',
      body: 'Lo que no debe verse todavía.',
      areaId: Number(area.id),
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
    const area = await createArea(payload)
    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Borrador programado',
      body: '.',
      areaId: Number(area.id),
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
    const area = await createArea(payload)
    await publicarNoticia({
      payload,
      user: staff,
      title: 'Con autoría',
      body: '.',
      areaId: Number(area.id),
      now: at('2026-09-16'),
    })

    const noticias = await noticiasDelTablon({
      payload,
      user: familia,
      areaId: Number(area.id),
      now: at('2026-09-20'),
    })
    expect(JSON.stringify(noticias)).not.toContain(staff.email)
  })
})
