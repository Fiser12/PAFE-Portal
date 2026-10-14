/** T19: Xabi tiene «Catálogo y préstamos» y no podía entrar al panel a gestionar el catálogo ni ver las reservas */
import { beforeAll, describe, expect, it } from 'vitest'
import { createLocalReq, type Payload } from 'payload'
import type { User } from '@/payload-types'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createUser } from './helpers/factory'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const entraAlPanel = async (user: User) =>
  payload.collections.users.config.access.admin?.({ req: await createLocalReq({ user }, payload) })

const loQueVe = (user: User) =>
  payload.config.collections
    .filter(({ admin }) =>
      typeof admin?.hidden === 'function' ? !admin.hidden({ user }) : !admin?.hidden,
    )
    .map(({ slug }) => slug)
    .filter((slug) => !slug.startsWith('payload-'))
    .sort()

describe('quién entra al panel', () => {
  it('cada rol de gestión entra', async () => {
    for (const role of ['admin', 'admin-catalogo', 'admin-news', 'admin-users'] as const) {
      expect(await entraAlPanel(await createUser(payload, [role]))).toBe(true)
    }
  })

  it('una psicóloga o una familia sin rol de gestión, no', async () => {
    expect(await entraAlPanel(await createUser(payload, ['profesional']))).toBe(false)
    expect(await entraAlPanel(await createFamilia(payload))).toBe(false)
  })
})

describe('cada cual ve en el panel solo lo suyo', () => {
  it('Catálogo y préstamos: el catálogo, sus reservas y avisos, y las imágenes', async () => {
    const xabi = await createUser(payload, ['admin-catalogo'], 'Xabi')
    expect(loQueVe(xabi)).toEqual(
      [
        'catalog-item',
        'external-resources',
        'files',
        'media',
        'notification',
        'reservation',
        'taxonomy',
      ].sort(),
    )
  })

  it('Tablón: las noticias, sus respuestas y adjuntos', async () => {
    const tablon = await createUser(payload, ['admin-news'])
    expect(loQueVe(tablon)).toEqual(['adjunto', 'noticia', 'respuesta'])
  })

  it('Altas de personas: los usuarios', async () => {
    expect(loQueVe(await createUser(payload, ['admin-users']))).toContain('users')
  })
})

describe('Catálogo y préstamos gestiona el catálogo', () => {
  it('crea, edita y borra materiales', async () => {
    const xabi = await createUser(payload, ['admin-catalogo'], 'Xabi')
    const base = await createItem(payload)
    const nuevo = await payload.create({
      collection: 'catalog-item',
      data: { ...base, id: undefined, title: 'Material nuevo de Xabi' } as never,
      user: xabi,
      overrideAccess: false,
    })
    const editado = await payload.update({
      collection: 'catalog-item',
      id: nuevo.id,
      data: { title: 'Material corregido' },
      user: xabi,
      overrideAccess: false,
    })
    expect(editado.title).toBe('Material corregido')
    await payload.delete({ collection: 'catalog-item', id: nuevo.id, user: xabi, overrideAccess: false })
  })

  it('ve las reservas de todas las familias', async () => {
    const xabi = await createUser(payload, ['admin-catalogo'], 'Xabi')
    const familia = await createFamilia(payload)
    const item = await createItem(payload)
    const reserva = await payload.create({
      collection: 'reservation',
      data: {
        item: item.id,
        user: familia.id,
        status: 'reservada',
        reservationDate: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: 'reservation',
      where: { id: { equals: reserva.id } },
      user: xabi,
      overrideAccess: false,
    })
    expect(docs).toHaveLength(1)
  })
})

describe('Altas de personas no puede quedarse con la cuenta de otro gestor', () => {
  const cambiarCorreo = async (quien: User, de: User) =>
    payload.update({
      collection: 'users',
      id: de.id,
      data: { email: `nuevo-${Date.now()}-${de.id}@pafe.test` },
      user: quien,
      overrideAccess: false,
      req: { payloadAPI: 'REST' },
    })

  it('no cambia el correo de quien gestiona otra área o es psicólogo', async () => {
    const altas = await createUser(payload, ['admin-users'], 'Altas')
    for (const role of ['admin-catalogo', 'admin-news', 'admin-users', 'profesional'] as const) {
      await expect(cambiarCorreo(altas, await createUser(payload, [role]))).rejects.toThrow()
    }
  })

  it('sí el de una familia, que es a quien da de alta', async () => {
    const altas = await createUser(payload, ['admin-users'], 'Altas')
    const familia = await createFamilia(payload)
    expect((await cambiarCorreo(altas, familia)).email).toContain('nuevo-')
  })
})

describe('Catálogo y préstamos sabe de quién es cada reserva y cada aviso', () => {
  const reservaDe = async (familia: User) => {
    const item = await createItem(payload)
    return payload.create({
      collection: 'reservation',
      data: {
        item: item.id,
        user: familia.id,
        status: 'reservada',
        reservationDate: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  }

  it('ve el nombre de la familia que ha reservado', async () => {
    const xabi = await createUser(payload, ['admin-catalogo'], 'Xabi')
    const familia = await createUser(payload, ['familia'], 'Familia Etxeberria')
    const reserva = await reservaDe(familia)

    const vista = await payload.findByID({
      collection: 'reservation',
      id: reserva.id,
      depth: 1,
      user: xabi,
      overrideAccess: false,
    })

    expect(typeof vista.user === 'object' && vista.user?.name).toBe('Familia Etxeberria')
  })

  it('pero no puede cambiar la ficha de nadie', async () => {
    const xabi = await createUser(payload, ['admin-catalogo'], 'Xabi')
    const familia = await createFamilia(payload)
    await expect(
      payload.update({
        collection: 'users',
        id: familia.id,
        data: { name: 'Cambiado por Xabi' },
        user: xabi,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('una psicóloga sin rol de gestión sigue viendo solo su propia ficha', async () => {
    const psicologa = await createUser(payload, ['profesional'])
    await createFamilia(payload)
    const { docs } = await payload.find({ collection: 'users', user: psicologa, overrideAccess: false })
    expect(docs.map((u) => u.id)).toEqual([psicologa.id])
  })
})

