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
  it('permite Catálogo a psicólogos y administradores; deniega familias, pendientes y roles de gestión sin pertenencia', async () => {
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
      const consulta = payload.find({ collection: 'catalog-item', user, overrideAccess: false })
      if (tecnico) expect((await consulta).totalDocs).toBeGreaterThan(0)
      else await expect(consulta).rejects.toThrow()
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
      expect(urls.includes('/wiki')).toBe(tecnico)
      expect(urls.includes('/admin')).toBe(role === 'admin')
      expect(urls).toContain('/area-personal')
    }
    expect(await esEquipoTecnico(payload, await createUser(payload, []))).toBe(false)
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

  it('impide que las familias creen reservas directamente por la API', async () => {
    const user = await createUser(payload, ['familia'])
    const item = await createItem(payload)
    await expect(
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
      }),
    ).rejects.toThrow()
  })

  it('también bloquea el índice de búsqueda y los recursos descargables para familias', async () => {
    const user = await createUser(payload, ['familia'])
    for (const collection of ['search', 'files', 'external-resources'] as const) {
      await expect(payload.find({ collection, user, overrideAccess: false })).rejects.toThrow()
    }
  })
})
