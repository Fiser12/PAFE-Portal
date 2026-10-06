/** T15: archivar y mover desde la lista del foro, de una en una o varias a la vez */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import { moderarNoticias, publicarNoticia } from '@/modules/tablon/services'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createStaff, createUser } from './helpers/factory'
import { at } from './helpers/dates'

let payload: Payload
let alberto: User

beforeAll(async () => {
  payload = await getTestPayload()
  alberto = await createUser(payload, ['admin'], 'Alberto')
})

beforeEach(async () => {
  await payload.delete({ collection: 'noticia', where: {}, overrideAccess: true })
})

const publicar = async (title: string) => {
  const staff = await createStaff(payload)
  const noticia = await publicarNoticia({
    payload,
    user: staff,
    title,
    body: '.',
    area: 'berriak-pafe',
    now: at('2026-09-16'),
  })
  return Number(noticia.id)
}

const estado = async (id: number) => {
  const { area, archivada } = await payload.findByID({
    collection: 'noticia',
    id,
    depth: 0,
    overrideAccess: true,
  })
  return { area, archivada: Boolean(archivada) }
}

describe('archivar desde la lista', () => {
  it('archiva varias de una vez', async () => {
    const ids = [await publicar('Una'), await publicar('Dos'), await publicar('Tres')]
    const quieta = await publicar('Se queda')

    expect(await moderarNoticias({ payload, user: alberto, ids, accion: { tipo: 'archivar' } })).toBe(3)

    for (const id of ids) expect((await estado(id)).archivada).toBe(true)
    expect((await estado(quieta)).archivada).toBe(false)
  })

  it('las recupera del archivo de una vez', async () => {
    const ids = [await publicar('Una'), await publicar('Dos')]
    await moderarNoticias({ payload, user: alberto, ids, accion: { tipo: 'archivar' } })

    await moderarNoticias({ payload, user: alberto, ids, accion: { tipo: 'desarchivar' } })

    for (const id of ids) expect((await estado(id)).archivada).toBe(false)
  })

  it('un psicólogo también archiva varias', async () => {
    const ids = [await publicar('Una'), await publicar('Dos')]
    const psicologo = await createStaff(payload)

    expect(
      await moderarNoticias({ payload, user: psicologo, ids, accion: { tipo: 'archivar' } }),
    ).toBe(2)
  })

  it('una familia no puede, y no se toca nada', async () => {
    const id = await publicar('Intocable')
    const familia = await createFamilia(payload)

    await expect(
      moderarNoticias({ payload, user: familia, ids: [id], accion: { tipo: 'archivar' } }),
    ).rejects.toMatchObject({ code: 'sin-permiso' })
    expect((await estado(id)).archivada).toBe(false)
  })

  it('no vuelve a avisar a nadie', async () => {
    const familia = await createFamilia(payload)
    const ids = [await publicar('Avisada una vez')]
    await moderarNoticias({ payload, user: alberto, ids, accion: { tipo: 'archivar' } })
    await moderarNoticias({ payload, user: alberto, ids, accion: { tipo: 'desarchivar' } })

    const { userNotifications } = await import('@/modules/catalog/services')
    const avisos = (await userNotifications({ payload, userId: Number(familia.id) })).filter(
      (n) => n.type === 'noticia',
    )
    expect(avisos).toHaveLength(1)
  })
})

describe('mover desde la lista', () => {
  it('administración mueve varias a otra área', async () => {
    const ids = [await publicar('Una'), await publicar('Dos')]

    expect(
      await moderarNoticias({ payload, user: alberto, ids, accion: { tipo: 'mover', area: 'ia' } }),
    ).toBe(2)

    for (const id of ids) expect((await estado(id)).area).toBe('ia')
  })

  it('mover no archiva ni desarchiva', async () => {
    const id = await publicar('Archivada')
    await moderarNoticias({ payload, user: alberto, ids: [id], accion: { tipo: 'archivar' } })

    await moderarNoticias({
      payload,
      user: alberto,
      ids: [id],
      accion: { tipo: 'mover', area: 'ia' },
    })

    expect(await estado(id)).toEqual({ area: 'ia', archivada: true })
  })

  it('un psicólogo no mueve: cambiar de área cambia quién la ve', async () => {
    const id = await publicar('Quieta')
    const psicologo = await createStaff(payload)

    await expect(
      moderarNoticias({
        payload,
        user: psicologo,
        ids: [id],
        accion: { tipo: 'mover', area: 'lantalde-teknikoa' },
      }),
    ).rejects.toMatchObject({ code: 'sin-permiso' })
    expect((await estado(id)).area).toBe('berriak-pafe')
  })

  it('un área que no existe no se acepta', async () => {
    const id = await publicar('Quieta')

    await expect(
      moderarNoticias({
        payload,
        user: alberto,
        ids: [id],
        accion: { tipo: 'mover', area: 'inventada' },
      }),
    ).rejects.toMatchObject({ code: 'area-requerida' })
    expect((await estado(id)).area).toBe('berriak-pafe')
  })
})

describe('lo que llega del navegador', () => {
  it('sin nada seleccionado no hace nada', async () => {
    const id = await publicar('Quieta')

    expect(
      await moderarNoticias({ payload, user: alberto, ids: [], accion: { tipo: 'archivar' } }),
    ).toBe(0)
    expect((await estado(id)).archivada).toBe(false)
  })

  it('descarta lo que no es un identificador y no repite', async () => {
    const id = await publicar('Una')

    expect(
      await moderarNoticias({
        payload,
        user: alberto,
        ids: [id, id, Number.NaN, 1.5, -3],
        accion: { tipo: 'archivar' },
      }),
    ).toBe(1)
  })
})

describe('si alguna no se puede cambiar', () => {
  it('no se da por hecho: se avisa del fallo', async () => {
    const conFallos = {
      update: async () => ({ docs: [{ id: 1 }], errors: [{ id: 2, message: 'falló' }] }),
    } as unknown as Payload

    await expect(
      moderarNoticias({
        payload: conFallos,
        user: alberto,
        ids: [1, 2],
        accion: { tipo: 'archivar' },
      }),
    ).rejects.toThrow('2')
  })
})

