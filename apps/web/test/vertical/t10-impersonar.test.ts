/** T10: impersonar usuarios. Un rol aparte que solo reparte el superadmin */
import { webcrypto } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { User } from '@/payload-types'
import { ALL_ROLES, ROLE_LABELS, ROLE_IMPERSONAR, puedeImpersonar } from '@/core/permissions'
import { getTestAuth } from './helpers/payload'
import { createUser } from './helpers/factory'

let payload: Awaited<ReturnType<typeof getTestAuth>>
/** Lo que responde el hook de Payload cuando alguien intenta escalar */
const PROHIBIDO = { status: 403 }
const SUPERADMIN = 'super@pafe.test'
const entornoPrevio = {
  ENABLED_SUPER_ADMIN: process.env.ENABLED_SUPER_ADMIN,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
}

beforeAll(async () => {
  payload = await getTestAuth()
  process.env.ENABLED_SUPER_ADMIN = 'true'
  process.env.SUPER_ADMIN_EMAIL = SUPERADMIN
})

afterAll(() => {
  Object.assign(process.env, entornoPrevio)
})

const superadmin = () =>
  payload.create({
    collection: 'users',
    data: { email: SUPERADMIN, name: 'Superadmin', role: ['admin'], emailVerified: true },
    overrideAccess: true,
  })

/** Como llega un cambio desde el panel: por REST, con la sesión de quien lo hace */
const cambiarRoles = (quien: User, a: User, role: NonNullable<User['role']>) =>
  payload.update({
    collection: 'users',
    id: a.id,
    data: { role },
    user: quien,
    overrideAccess: false,
    req: { payloadAPI: 'REST' },
  })

/** La cookie de sesión firmada tal como la pone better-auth en el navegador */
const cookieDeSesion = async (usuario: User) => {
  const ctx = await payload.betterAuth.$context
  const sesion = await ctx.internalAdapter.createSession(String(usuario.id))
  const clave = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ctx.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const firma = await webcrypto.subtle.sign('HMAC', clave, new TextEncoder().encode(sesion.token))
  const valor = `${sesion.token}.${btoa(String.fromCharCode(...new Uint8Array(firma)))}`
  return `${ctx.authCookies.sessionToken.name}=${encodeURIComponent(valor)}`
}

/** Como lo pide el navegador: por HTTP, con su cookie y desde el propio portal */
const peticion = (ruta: string, cookie: string, cuerpo?: object) =>
  payload.betterAuth.handler(
    new Request(`http://localhost:3000/api/auth${ruta}`, {
      method: 'POST',
      headers: { cookie, origin: 'http://localhost:3000', 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo ?? {}),
    }),
  )

const impersonar = async (quien: User, a: User) =>
  peticion('/impersonar/iniciar', await cookieDeSesion(quien), { userId: String(a.id) })

const terminar = (cookie: string) => peticion('/impersonar/terminar', cookie)

/** Las cookies que deja una respuesta, como las guardaría el navegador */
const cookiesDe = (respuesta: Response) => {
  const guardadas = new Map<string, string>()
  for (const linea of respuesta.headers.getSetCookie()) {
    const [par = ''] = linea.split(';')
    const [nombre = '', valor = ''] = par.split('=')
    if (valor) guardadas.set(nombre, valor)
    else guardadas.delete(nombre)
  }
  return [...guardadas].map(([nombre, valor]) => `${nombre}=${valor}`).join('; ')
}

const quienEs = async (cookie: string) =>
  (await payload.betterAuth.api.getSession({ headers: new Headers({ cookie }) }))?.user.id

describe('el rol de impersonar', () => {
  it('existe y se llama por lo que hace', () => {
    expect(ALL_ROLES).toContain(ROLE_IMPERSONAR)
    expect(ROLE_LABELS[ROLE_IMPERSONAR]).toBe('Impersonar usuarios')
  })

  it('no lo da ser admin: hay que tenerlo', () => {
    expect(puedeImpersonar({ id: 1, email: 'a@pafe.test', role: ['admin'] })).toBe(false)
    expect(puedeImpersonar({ id: 1, email: 'a@pafe.test', role: ['impersonar'] })).toBe(true)
  })
})

describe('quién reparte el rol de impersonar', () => {
  it('un admin no se lo puede dar a nadie, ni a sí mismo', async () => {
    const admin = await createUser(payload, ['admin'], 'Alberto')
    const familia = await createUser(payload, ['familia'])
    await expect(cambiarRoles(admin, familia, ['familia', 'impersonar'])).rejects.toMatchObject(PROHIBIDO)
    await expect(cambiarRoles(admin, admin, ['admin', 'impersonar'])).rejects.toMatchObject(PROHIBIDO)
  })

  it('un admin tampoco se lo puede quitar a quien lo tiene', async () => {
    const admin = await createUser(payload, ['admin'])
    const conRol = await createUser(payload, ['admin', 'impersonar'])
    await expect(cambiarRoles(admin, conRol, ['admin'])).rejects.toMatchObject(PROHIBIDO)
  })

  it('un admin sigue pudiendo cambiar los demás roles de quien lo tiene', async () => {
    const admin = await createUser(payload, ['admin'])
    const conRol = await createUser(payload, ['familia', 'impersonar'])
    const cambiado = await cambiarRoles(admin, conRol, ['profesional', 'impersonar'])
    expect(cambiado.role).toEqual(['profesional', 'impersonar'])
  })

  it('el superadmin sí lo da y lo quita', async () => {
    const yo = await superadmin()
    const alguien = await createUser(payload, ['admin'])
    expect((await cambiarRoles(yo, alguien, ['admin', 'impersonar'])).role).toContain('impersonar')
    expect((await cambiarRoles(yo, alguien, ['admin'])).role).not.toContain('impersonar')
    expect((await cambiarRoles(yo, yo, ['admin', 'impersonar'])).role).toContain('impersonar')
  })
})

describe('impersonar a alguien', () => {
  it('quien tiene el rol entra como una familia y la sesión recuerda quién es', async () => {
    const yo = await createUser(payload, ['admin', 'impersonar'])
    const familia = await createUser(payload, ['familia'])
    await impersonar(yo, familia)
    const sesiones = await payload.find({
      collection: 'sessions',
      where: { user: { equals: familia.id }, impersonatedBy: { equals: yo.id } },
      overrideAccess: true,
    })
    expect(sesiones.totalDocs).toBe(1)
  })

  it('el navegador pasa a ser la familia y al volver recupera su cuenta', async () => {
    const yo = await createUser(payload, ['profesional', 'impersonar'])
    const familia = await createUser(payload, ['familia'])
    const dentro = await impersonar(yo, familia)
    expect(dentro.status).toBe(200)
    const comoFamilia = cookiesDe(dentro)
    expect(String(await quienEs(comoFamilia))).toBe(String(familia.id))

    const fuera = await terminar(comoFamilia)
    expect(fuera.status).toBe(200)
    expect(String(await quienEs(cookiesDe(fuera)))).toBe(String(yo.id))
  })

  it('volver sin estar impersonando no hace nada', async () => {
    const familia = await createUser(payload, ['familia'])
    expect((await terminar(await cookieDeSesion(familia))).status).toBe(400)
  })

  it('un admin sin el rol no puede', async () => {
    const admin = await createUser(payload, ['admin'])
    const familia = await createUser(payload, ['familia'])
    expect((await impersonar(admin, familia)).status).toBe(403)
  })

  it('una familia no puede', async () => {
    const familia = await createUser(payload, ['familia'])
    const otra = await createUser(payload, ['familia'])
    expect((await impersonar(familia, otra)).status).toBe(403)
  })

  it('no se puede impersonar a un admin: sería hacerse admin', async () => {
    const yo = await createUser(payload, ['profesional', 'impersonar'])
    const admin = await createUser(payload, ['admin'])
    expect((await impersonar(yo, admin)).status).toBe(403)
  })

  it('tampoco a un admin que además tiene otros roles', async () => {
    const yo = await createUser(payload, ['profesional', 'impersonar'])
    const admin = await createUser(payload, ['admin', 'admin-news'])
    expect((await impersonar(yo, admin)).status).toBe(403)
  })
})

describe('no hay puerta trasera para administrar usuarios desde better-auth', () => {
  it('no existen los endpoints de administración del plugin admin', () => {
    const api = payload.betterAuth.api as Record<string, unknown>
    expect(api.setRole).toBeUndefined()
    expect(api.listUsers).toBeUndefined()
    expect(api.banUser).toBeUndefined()
    expect(api.impersonateUser).toBeUndefined()
  })
})

describe('better-auth sigue funcionando con el plugin de impersonar', () => {
  const alta = (email: string, adminInviteToken?: string) =>
    payload.betterAuth.api.signUpEmail({
      body: { email, password: 'contraseña-larga-123', name: 'Nueva' },
      query: adminInviteToken ? { adminInviteToken } : undefined,
      asResponse: true,
    })

  it('la sesión de quien entra se reconoce', async () => {
    const familia = await createUser(payload, ['familia'])
    const sesion = await payload.betterAuth.api.getSession({
      headers: new Headers({ cookie: await cookieDeSesion(familia) }),
    })
    expect(String(sesion?.user.id)).toBe(String(familia.id))
  })

  it('el alta con contraseña sigue cerrada sin invitación', async () => {
    await expect(alta(`sin-invitacion-${Date.now()}@pafe.test`)).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('con una invitación válida sí se entra', async () => {
    const token = `invitacion-${Date.now()}`
    await payload.create({
      collection: 'admin-invitations',
      data: { role: 'familia', token },
      overrideAccess: true,
    })
    const respuesta = await alta(`con-invitacion-${Date.now()}@pafe.test`, token)
    expect(respuesta.status).toBe(200)
  })

  it('no se puede invitar a nadie con el rol de impersonar', async () => {
    await expect(
      payload.create({
        collection: 'admin-invitations',
        data: { role: ROLE_IMPERSONAR as 'familia', token: `colada-${Date.now()}` },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })
})
