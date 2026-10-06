import { beforeAll, describe, expect, it } from 'vitest'
import { createLocalReq, type Payload } from 'payload'
import { esEquipoTecnico } from '@/core/technical-access'
import { getNavItems } from '@/components/layout/nav-items'
import { textosDe } from '@/core/textos'
import { GRUPO_LANTALDE } from '@/modules/tablon/domain/areas'
import { getTestPayload } from './helpers/payload'
import { createItem, createUser, meterEnGrupo } from './helpers/factory'

let payload: Payload
beforeAll(async () => {
  payload = await getTestPayload()
})

describe('acceso al portal: psicólogos, familias y administración', () => {
  it('abre el Catálogo a toda persona con rol y deja la Wiki y la gestión del catálogo al equipo técnico', async () => {
    const item = await createItem(payload)
    for (const role of [
      'familia',
      'admin-news',
      'admin-users',
      'admin-catalogo',
      'profesional',
      'admin',
    ] as const) {
      const user = await createUser(payload, [role])
      const tecnico = role === 'profesional' || role === 'admin'
      expect(await esEquipoTecnico(payload, user)).toBe(tecnico)
      expect(
        (await payload.find({ collection: 'catalog-item', user, overrideAccess: false }))
          .totalDocs,
      ).toBeGreaterThan(0)
      const edicion = payload.update({
        collection: 'catalog-item',
        id: item.id,
        data: { title: `Material editado por ${role}` },
        user,
        overrideAccess: false,
      })
      if (tecnico) expect((await edicion).title).toBe(`Material editado por ${role}`)
      else await expect(edicion).rejects.toThrow()

      const adminAccess = payload.collections.users.config.access.admin
      expect(await adminAccess?.({ req: await createLocalReq({ user }, payload) })).toBe(
        role === 'admin',
      )
      const urls = getNavItems(user, textosDe('es'), tecnico).map(({ href }) => href)
      expect(urls).toContain('/catalog')
      expect(urls.includes('/wiki')).toBe(tecnico)
      expect(urls.includes('/admin')).toBe(role === 'admin')
      expect(urls).toContain('/area-personal')
    }
    const pendiente = await createUser(payload, [])
    expect(await esEquipoTecnico(payload, pendiente)).toBe(false)
    await expect(
      payload.find({ collection: 'catalog-item', user: pendiente, overrideAccess: false }),
    ).rejects.toThrow()
    expect(getNavItems(pendiente, textosDe('es')).map(({ href }) => href)).not.toContain(
      '/catalog',
    )
    expect(await esEquipoTecnico(payload, null)).toBe(false)
  })

  it('respeta los miembros históricos del grupo y no confía en el nombre poblado que se le pase', async () => {
    const existing = await payload.find({
      collection: 'groups',
      where: { name: { equals: GRUPO_LANTALDE } },
      limit: 1,
    })
    const group =
      existing.docs[0] ??
      (await payload.create({ collection: 'groups', data: { name: GRUPO_LANTALDE } }))
    const user = await createUser(payload, ['familia'])
    await meterEnGrupo(payload, user.id, group.id)
    const updated = await payload.findByID({ collection: 'users', id: user.id, depth: 0 })
    expect(await esEquipoTecnico(payload, updated)).toBe(true)
    const other = await payload.create({
      collection: 'groups',
      data: { name: `familias-${Date.now()}` },
    })
    expect(
      await esEquipoTecnico(payload, { ...user, groups: [{ ...other, name: GRUPO_LANTALDE }] }),
    ).toBe(false)
    expect(await esEquipoTecnico(payload, { ...updated, role: [] })).toBe(false)
  })

  it('las familias reservan por la API y quien no tiene rol no', async () => {
    const item = await createItem(payload)
    const reserva = (user: Awaited<ReturnType<typeof createUser>>) =>
      payload.create({
        collection: 'reservation',
        data: {
          item: item.id,
          user: user.id,
          status: 'reservada',
          reservationDate: new Date().toISOString(),
        },
        user,
        overrideAccess: false,
      })
    expect((await reserva(await createUser(payload, ['familia']))).id).toBeDefined()
    await expect(reserva(await createUser(payload, []))).rejects.toThrow()
  })

  it('las familias buscan y abren los recursos descargables; quien no tiene rol no', async () => {
    const familia = await createUser(payload, ['familia'])
    const pendiente = await createUser(payload, [])
    for (const collection of ['search', 'files', 'external-resources'] as const) {
      await expect(
        payload.find({ collection, user: familia, overrideAccess: false }),
      ).resolves.toBeDefined()
      await expect(
        payload.find({ collection, user: pendiente, overrideAccess: false }),
      ).rejects.toThrow()
    }
  })
})
