/** T11: el panel del admin enseña lo operativo; lo que está a medio hacer, solo el superadmin */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import { getTestPayload } from './helpers/payload'
import { createUser } from './helpers/factory'

let payload: Payload
const SUPERADMIN = 'super-panel@pafe.test'
const entornoPrevio = {
  ENABLED_SUPER_ADMIN: process.env.ENABLED_SUPER_ADMIN,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
}

let admin: User
let superadmin: User

beforeAll(async () => {
  payload = await getTestPayload()
  process.env.ENABLED_SUPER_ADMIN = 'true'
  process.env.SUPER_ADMIN_EMAIL = SUPERADMIN
  admin = await createUser(payload, ['admin'], 'Alberto')
  superadmin = await payload.create({
    collection: 'users',
    data: { email: SUPERADMIN, name: 'Superadmin', role: ['admin'], emailVerified: true },
    overrideAccess: true,
  })
})

afterAll(() => {
  Object.assign(process.env, entornoPrevio)
})

const NO_OPERATIVAS = [
  'cases',
  'tasks',
  'tasks-completed',
  'guided-questionnaires',
  'questionnaire-executions',
  'formaciones',
  'pages',
  'posts',
  'search',
  'accounts',
  'sessions',
  'verifications',
] as const

const OPERATIVAS = [
  'users',
  'groups',
  'admin-invitations',
  'noticia',
  'respuesta',
  'adjunto',
  'catalog-item',
  'reservation',
  'notification',
  'external-resources',
  'files',
  'media',
] as const

const oculta = (hidden: unknown, user: User): boolean =>
  typeof hidden === 'function' ? Boolean(hidden({ user })) : Boolean(hidden)

const ocultaColeccion = (slug: string, user: User) =>
  oculta(payload.collections[slug as 'users']?.config.admin.hidden, user)

const ocultaGlobal = (slug: string, user: User) =>
  oculta(payload.config.globals.find((g) => g.slug === slug)?.admin?.hidden, user)

describe('lo que no está operativo solo lo ve el superadmin', () => {
  it.each(NO_OPERATIVAS)('%s no sale en el menú de un admin', (slug) => {
    expect(ocultaColeccion(slug, admin)).toBe(true)
  })

  it.each(NO_OPERATIVAS)('%s sí le sale al superadmin', (slug) => {
    expect(ocultaColeccion(slug, superadmin)).toBe(false)
  })

  it.each(['header', 'footer'])('la configuración de %s tampoco la ve un admin', (slug) => {
    expect(ocultaGlobal(slug, admin)).toBe(true)
    expect(ocultaGlobal(slug, superadmin)).toBe(false)
  })
})

describe('lo operativo lo sigue viendo el admin', () => {
  it.each(OPERATIVAS)('%s le sale a un admin', (slug) => {
    expect(ocultaColeccion(slug, admin)).toBe(false)
  })

  it('la presentación del catálogo también', () => {
    expect(ocultaGlobal('presentacion-catalogo', admin)).toBe(false)
  })
})

describe('un admin no cambia lo que no está operativo, aunque escriba la dirección', () => {
  const creaCaso = (user: User) =>
    payload.create({
      collection: 'cases',
      data: { title: `Caso ${Date.now()}` },
      user,
      overrideAccess: false,
    })

  it('no crea casos', async () => {
    await expect(creaCaso(admin)).rejects.toMatchObject({ status: 403 })
  })

  it('el superadmin sí', async () => {
    expect((await creaCaso(superadmin)).id).toBeTruthy()
  })

  it('no toca la cabecera del sitio', async () => {
    await expect(
      payload.updateGlobal({ slug: 'header', data: {}, user: admin, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('no borra páginas ni formaciones', async () => {
    for (const collection of ['pages', 'formaciones', 'guided-questionnaires'] as const) {
      await expect(
        payload.delete({
          collection,
          where: { id: { exists: true } },
          user: admin,
          overrideAccess: false,
        }),
      ).rejects.toMatchObject({ status: 403 })
    }
  })
})

describe('la ficha de usuario del admin', () => {
  it('no enseña los casos asignados', async () => {
    const familia = await createUser(payload, ['familia'])
    const vista = await payload.findByID({
      collection: 'users',
      id: familia.id,
      user: admin,
      overrideAccess: false,
    })
    expect(vista).not.toHaveProperty('assignedCases')
  })

  it('al superadmin sí', async () => {
    const familia = await createUser(payload, ['familia'])
    const vista = await payload.findByID({
      collection: 'users',
      id: familia.id,
      user: superadmin,
      overrideAccess: false,
    })
    expect(vista).toHaveProperty('assignedCases')
  })
})
