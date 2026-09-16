/** T11: archivar una noticia la saca del tablón sin borrarla */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createStaff } from './helpers/factory'
import { at } from './helpers/dates'
import {
  archivarNoticia,
  desarchivarNoticia,
  noticiaDelTablon,
  noticiasDelTablon,
  publicarNoticia,
} from '@/modules/tablon/services'

const AREA = 'berriak-pafe' as const

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await payload.delete({ collection: 'noticia', where: {}, overrideAccess: true })
})

const publicar = async (title: string) => {
  const staff = await createStaff(payload)
  return publicarNoticia({ payload, user: staff, title, body: '.', area: AREA, now: at('2026-09-16') })
}

const titulos = async (
  user: Awaited<ReturnType<typeof createFamilia>>,
  opts: { archivadas?: boolean } = {},
) =>
  (await noticiasDelTablon({ payload, user, now: at('2026-09-20'), ...opts })).map((n) => n.title)

describe('archivar', () => {
  it('una noticia archivada desaparece del tablón', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const noticia = await publicar('Ya pasó')

    await archivarNoticia({ payload, user: staff, noticiaId: Number(noticia.id) })

    expect(await titulos(familia)).not.toContain('Ya pasó')
  })

  it('pero sigue estando, y se puede pedir a propósito', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const noticia = await publicar('Ya pasó')
    await archivarNoticia({ payload, user: staff, noticiaId: Number(noticia.id) })

    expect(await titulos(familia, { archivadas: true })).toContain('Ya pasó')
  })

  it('se sigue abriendo por su URL', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const noticia = await publicar('Ya pasó')
    await archivarNoticia({ payload, user: staff, noticiaId: Number(noticia.id) })

    const abierta = await noticiaDelTablon({
      payload,
      user: familia,
      id: noticia.id,
      now: at('2026-09-20'),
    })
    expect(abierta?.title).toBe('Ya pasó')
  })

  it('se puede sacar del archivo', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const noticia = await publicar('Vuelve')
    await archivarNoticia({ payload, user: staff, noticiaId: Number(noticia.id) })
    await desarchivarNoticia({ payload, user: staff, noticiaId: Number(noticia.id) })

    expect(await titulos(familia)).toContain('Vuelve')
  })

  it('una familia no puede archivar', async () => {
    const familia = await createFamilia(payload)
    const noticia = await publicar('Intocable')

    await expect(
      archivarNoticia({ payload, user: familia, noticiaId: Number(noticia.id) }),
    ).rejects.toMatchObject({ code: 'sin-permiso' })
  })

  it('archivar no vuelve a avisar a nadie', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const noticia = await publicar('Avisada una vez')
    await archivarNoticia({ payload, user: staff, noticiaId: Number(noticia.id) })

    const { userNotifications } = await import('@/modules/catalog/services')
    const avisos = (await userNotifications({ payload, userId: Number(familia.id) })).filter(
      (n) => n.type === 'noticia',
    )
    expect(avisos).toHaveLength(1)
  })
})
