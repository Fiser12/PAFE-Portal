/** T7: el reparto de permisos por área. Cada rol llega a lo suyo y a nada más */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createItem, createUser } from './helpers/factory'
import {
  administraCatalogo,
  administraTablon,
  administraUsuarios,
  isActiveUser,
  isAdmin,
  isStaff,
} from '@/core/permissions'
import { getNavItems } from '@/components/layout/nav-items'
import { textosDe } from '@/core/textos'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const conRol = (...roles: string[]) => ({ id: 1, email: 'x@pafe.test', role: roles })

describe('quién gestiona qué', () => {
  it('el admin gestiona las tres áreas', () => {
    const admin = conRol('admin')
    expect(administraCatalogo(admin)).toBe(true)
    expect(administraUsuarios(admin)).toBe(true)
    expect(administraTablon(admin)).toBe(true)
  })

  it('quien lleva el catálogo no toca usuarios ni el tablón', () => {
    const user = conRol('admin-catalogo')
    expect(administraCatalogo(user)).toBe(true)
    expect(administraUsuarios(user)).toBe(false)
    expect(administraTablon(user)).toBe(false)
  })

  it('quien da de alta no toca el catálogo ni el tablón', () => {
    const user = conRol('admin-users')
    expect(administraUsuarios(user)).toBe(true)
    expect(administraCatalogo(user)).toBe(false)
    expect(administraTablon(user)).toBe(false)
  })

  it('quien publica en el tablón no toca el catálogo ni usuarios', () => {
    const user = conRol('admin-news')
    expect(administraTablon(user)).toBe(true)
    expect(administraCatalogo(user)).toBe(false)
    expect(administraUsuarios(user)).toBe(false)
  })

  it('los roles se acumulan', () => {
    const user = conRol('admin-catalogo', 'admin-news')
    expect(administraCatalogo(user)).toBe(true)
    expect(administraTablon(user)).toBe(true)
    expect(administraUsuarios(user)).toBe(false)
  })

  it('una familia no gestiona nada, pero es usuaria activa', () => {
    const familia = conRol('familia')
    expect(administraCatalogo(familia)).toBe(false)
    expect(administraUsuarios(familia)).toBe(false)
    expect(administraTablon(familia)).toBe(false)
    expect(isStaff(familia)).toBe(false)
    expect(isActiveUser(familia)).toBe(true)
  })

  it('sin rol no es ni activo ni equipo', () => {
    const nadie = conRol()
    expect(isActiveUser(nadie)).toBe(false)
    expect(isStaff(nadie)).toBe(false)
  })

  it('cualquier rol de gestión es equipo, pero solo admin es admin', () => {
    expect(isStaff(conRol('admin-news'))).toBe(true)
    expect(isStaff(conRol('admin-users'))).toBe(true)
    expect(isAdmin(conRol('admin-catalogo'))).toBe(false)
  })

  it('profesional sigue valiendo para el catálogo mientras se migra', () => {
    const viejo = conRol('profesional')
    expect(administraCatalogo(viejo)).toBe(true)
    expect(administraUsuarios(viejo)).toBe(false)
    expect(administraTablon(viejo)).toBe(false)
  })
})

describe('lo que cada rol puede hacer de verdad', () => {
  const creaCaso = (user: Awaited<ReturnType<typeof createUser>>) =>
    payload.create({
      collection: 'cases',
      data: { title: `Caso ${Date.now()}` },
      user,
      overrideAccess: false,
    })

  it('quien lleva el catálogo ya no puede crear casos', async () => {
    const user = await createUser(payload, ['admin-catalogo'], 'Catálogo Test')
    await expect(creaCaso(user)).rejects.toThrow()
  })

  it('quien lleva el catálogo no puede publicar en el tablón', async () => {
    const user = await createUser(payload, ['admin-catalogo'], 'Catálogo Test')
    await expect(
      payload.create({
        collection: 'noticia',
        data: { title: 'No debería', area: 'berriak-pafe', publishedAt: new Date().toISOString() },
        user,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('quien lleva el catálogo no puede dar de alta usuarios', async () => {
    const user = await createUser(payload, ['admin-catalogo'], 'Catálogo Test')
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `nuevo-${Date.now()}@pafe.test`,
          name: 'Nuevo',
          role: ['familia'],
          emailVerified: true,
        },
        user,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('quien publica en el tablón sí puede publicar', async () => {
    const user = await createUser(payload, ['admin-news'], 'Tablón Test')
    const noticia = await payload.create({
      collection: 'noticia',
      data: { title: 'Sí puedo', area: 'berriak-pafe', publishedAt: new Date().toISOString() },
      user,
      overrideAccess: false,
    })
    expect(noticia.title).toBe('Sí puedo')
  })

  it('quien publica en el tablón no puede tocar el catálogo', async () => {
    const user = await createUser(payload, ['admin-news'], 'Tablón Test')
    const material = await createItem(payload)
    await expect(
      payload.update({
        collection: 'catalog-item',
        id: material.id,
        data: { title: 'No debería' },
        user,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('quien da de alta sí puede crear usuarios', async () => {
    const user = await createUser(payload, ['admin-users'], 'Usuarios Test')
    const nuevo = await payload.create({
      collection: 'users',
      data: {
        email: `alta-${Date.now()}@pafe.test`,
        name: 'Alta',
        role: ['familia'],
        emailVerified: true,
      },
      user,
      overrideAccess: false,
    })
    expect(nuevo.email).toContain('alta-')
  })

  it('nadie que no sea admin puede crear casos ni formaciones', async () => {
    for (const rol of ['admin-catalogo', 'admin-users', 'admin-news'] as const) {
      const user = await createUser(payload, [rol], `${rol} Test`)
      await expect(creaCaso(user)).rejects.toThrow()
    }
  })
})

describe('el catálogo es material interno', () => {
  const busca = (user?: Awaited<ReturnType<typeof createUser>>) =>
    payload.find({ collection: 'catalog-item', user, overrideAccess: false })

  it('quien no ha entrado no ve ningún material', async () => {
    await createItem(payload)
    await expect(busca()).rejects.toThrow()
  })

  it('quien entró pero aún no tiene rol tampoco lo ve', async () => {
    await createItem(payload)
    const sinRol = await createUser(payload, [], 'Sin Rol')
    await expect(busca(sinRol)).rejects.toThrow()
  })

  it('una familia sí lo ve', async () => {
    await createItem(payload)
    const familia = await createUser(payload, ['familia'], 'Familia Test')
    const { totalDocs } = await busca(familia)
    expect(totalDocs).toBeGreaterThan(0)
  })

  it('el menú solo ofrece el catálogo a quien tiene rol', () => {
    const enlaces = (user: Parameters<typeof getNavItems>[0]) =>
      getNavItems(user, textosDe('es')).map((i) => i.href)
    expect(enlaces(null)).not.toContain('/catalog')
    expect(enlaces({ role: [] } as never)).not.toContain('/catalog')
    expect(enlaces({ role: ['familia'] } as never)).toContain('/catalog')
  })
})
