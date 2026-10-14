/** T18: «El enlace no es válido o ha caducado». Cambiar la contraseña tiene que salir bien a la primera */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/payload-types'
import { invitarPersonas } from '@/modules/invitaciones/services'
import { getTestAuth } from './helpers/payload'
import { createUser } from './helpers/factory'
import { bodyOf, emailsTo, resetEmails } from './helpers/email'

let payload: Awaited<ReturnType<typeof getTestAuth>>
let admin: User

beforeAll(async () => {
  payload = await getTestAuth()
  admin = await createUser(payload, ['admin'], 'Alberto')
})

beforeEach(() => resetEmails())
afterEach(() => vi.useRealTimers())

let n = 0
const correo = (quien: string) => `${quien}-${Date.now().toString(36)}-${++n}@pafe.test`
const HORA = 60 * 60 * 1000

const conContrasena = async (email: string) => {
  await payload.betterAuth.api.signUpEmail({
    body: { email, password: 'contraseña-antigua-1', name: 'Psicóloga' },
    query: { adminInviteToken: await tokenDeInvitacion(email) },
  })
}

const tokenDeInvitacion = async (email: string) => {
  await invitarPersonas({ payload, user: admin, texto: email, rol: 'profesional' })
  const { docs } = await payload.find({
    collection: 'admin-invitations',
    where: { email: { equals: email } },
    overrideAccess: true,
  })
  return docs[0]!.token
}

const conGoogle = async (email: string) => {
  const contexto = await payload.betterAuth.$context
  await contexto.internalAdapter.createOAuthUser(
    { email, name: 'Con Google', emailVerified: true },
    { providerId: 'google', accountId: `google-${email}` },
  )
}

const pedirEnlace = (email: string) =>
  payload.betterAuth.api.requestPasswordReset({ body: { email, redirectTo: '/reset-password' } })

const ultimoCorreo = (email: string) => {
  const recibidos = emailsTo(email)
  return recibidos.at(-1)
}

const enlaceDe = (email: string) => {
  const mensaje = ultimoCorreo(email)
  const token = mensaje ? bodyOf(mensaje).match(/reset-password\/([\w-]+)\?/)?.[1] : undefined
  if (!token) throw new Error(`a ${email} no le ha llegado ningún enlace`)
  return token
}

/** Lo que pasa al pulsar el enlace del correo: adónde lleva al navegador */
const abrirEnlace = async (token: string) => {
  const respuesta = await payload.betterAuth.api.requestPasswordResetCallback({
    params: { token },
    query: { callbackURL: '/reset-password' },
    asResponse: true,
  })
  return respuesta.headers.get('location') ?? ''
}

const guardar = (token: string, newPassword: string) =>
  payload.betterAuth.api.resetPassword({ body: { token, newPassword } })

const entrar = (email: string, password: string) =>
  payload.betterAuth.api.signInEmail({ body: { email, password }, asResponse: true })

describe('cambiar la contraseña con el enlace del correo', () => {
  it('pedir el enlace, abrirlo, guardar la nueva y entrar con ella', async () => {
    const email = correo('oiartz')
    await conContrasena(email)

    await pedirEnlace(email)
    const token = enlaceDe(email)
    expect(await abrirEnlace(token)).toContain(`/reset-password?token=${token}`)
    await guardar(token, 'contraseña-nueva-2')

    expect((await entrar(email, 'contraseña-nueva-2')).status).toBe(200)
  })

  it('el enlace sigue valiendo al día siguiente', async () => {
    const email = correo('tarde')
    await conContrasena(email)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date())

    await pedirEnlace(email)
    const token = enlaceDe(email)
    vi.setSystemTime(Date.now() + 23 * HORA)

    expect(await abrirEnlace(token)).toContain(`/reset-password?token=${token}`)
  })

  it('pasadas 24 horas ya no vale, y se dice así', async () => {
    const email = correo('caducado')
    await conContrasena(email)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date())

    await pedirEnlace(email)
    const token = enlaceDe(email)
    vi.setSystemTime(Date.now() + 25 * HORA)

    expect(await abrirEnlace(token)).toContain('error=INVALID_TOKEN')
  })

  it('el enlace solo sirve una vez', async () => {
    const email = correo('una-vez')
    await conContrasena(email)
    await pedirEnlace(email)
    const token = enlaceDe(email)
    await guardar(token, 'contraseña-nueva-4')

    await expect(guardar(token, 'contraseña-nueva-5')).rejects.toMatchObject({
      body: { code: 'INVALID_TOKEN' },
    })
    expect(await abrirEnlace(token)).toContain('error=INVALID_TOKEN')
  })

  it('el correo dice cuánto dura el enlace', async () => {
    const email = correo('aviso')
    await conContrasena(email)

    await pedirEnlace(email)

    expect(bodyOf(ultimoCorreo(email)!)).toContain('24 horas')
  })

  it('pedir otro enlace no estropea el anterior', async () => {
    const email = correo('dos-veces')
    await conContrasena(email)
    await pedirEnlace(email)
    const primero = enlaceDe(email)
    await pedirEnlace(email)

    expect(await abrirEnlace(primero)).toContain(`/reset-password?token=${primero}`)
  })
})

describe('quien entra con Google', () => {
  it('también puede ponerse contraseña y entrar con ella', async () => {
    const email = correo('google')
    await conGoogle(email)

    await pedirEnlace(email)
    await guardar(enlaceDe(email), 'contraseña-nueva-3')

    expect((await entrar(email, 'contraseña-nueva-3')).status).toBe(200)
  })

  it('y el correo le recuerda que puede entrar con Google sin contraseña', async () => {
    const email = correo('google-aviso')
    await conGoogle(email)

    await pedirEnlace(email)

    expect(bodyOf(ultimoCorreo(email)!)).toContain('Entrar con Google')
  })

  it('a quien entra solo con contraseña no se le habla de Google', async () => {
    const email = correo('sin-google')
    await conContrasena(email)

    await pedirEnlace(email)

    expect(bodyOf(ultimoCorreo(email)!)).not.toContain('Entrar con Google')
  })
})

describe('quien todavía no ha creado su cuenta', () => {
  it('si está invitado, al pedir el enlace le vuelve a llegar su invitación', async () => {
    const email = correo('invitada')
    const token = await tokenDeInvitacion(email)
    resetEmails()

    await pedirEnlace(email)

    const mensaje = ultimoCorreo(email)
    expect(mensaje?.subject).toBe('Invitación al portal de PAFE')
    expect(bodyOf(mensaje!)).toContain(`token=${token}`)
  })

  it('si nadie le ha invitado, no se le manda nada', async () => {
    const email = correo('desconocida')

    await pedirEnlace(email)

    expect(emailsTo(email)).toHaveLength(0)
  })
})
