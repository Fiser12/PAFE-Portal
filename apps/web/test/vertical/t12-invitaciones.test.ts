/** T12: invitar personas. Cada correo lleva su propio enlace, que es lo que falló en producción */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@/payload-types'
import { invitarPersonas } from '@/modules/invitaciones/services'
import { getTestAuth } from './helpers/payload'
import { createUser } from './helpers/factory'
import { bodyOf, emailFailures, emailsTo, resetEmails, sentEmails } from './helpers/email'

let payload: Awaited<ReturnType<typeof getTestAuth>>
let admin: User

beforeAll(async () => {
  payload = await getTestAuth()
  admin = await createUser(payload, ['admin'], 'Alberto')
})

beforeEach(() => resetEmails())

let n = 0
const correo = (quien: string) => `${quien}-${Date.now().toString(36)}-${++n}@pafe.test`

const invitar = (texto: string, rol = 'familia', user: User = admin) =>
  invitarPersonas({ payload, user, texto, rol })

const pendientesDe = (email: string) =>
  payload.find({
    collection: 'admin-invitations',
    where: { email: { equals: email } },
    overrideAccess: true,
  })

const tokenDe = (email: string) => {
  const [mensaje] = emailsTo(email)
  return mensaje ? bodyOf(mensaje).match(/token=([\w-]+)/)?.[1] : undefined
}

const darseDeAlta = (email: string, token: string) =>
  payload.betterAuth.api.signUpEmail({
    body: { email, password: 'contraseña-larga-123', name: 'Nueva' },
    query: { adminInviteToken: token },
    asResponse: true,
  })

const rolesDe = async (email: string) =>
  (await payload.find({ collection: 'users', where: { email: { equals: email } }, overrideAccess: true }))
    .docs[0]?.role

describe('cada correo recibe su propia invitación', () => {
  it('varios correos seguidos llevan enlaces distintos', async () => {
    const correos = [correo('a'), correo('b'), correo('c')]
    const resultado = await invitar(correos.join('\n'))

    expect(resultado.map((r) => r.estado)).toEqual(['enviada', 'enviada', 'enviada'])
    expect(sentEmails).toHaveLength(3)
    const tokens = correos.map(tokenDe)
    expect(tokens.every(Boolean)).toBe(true)
    expect(new Set(tokens).size).toBe(3)
  })

  it('dos invitaciones seguidas desde el mismo panel tampoco comparten enlace', async () => {
    const primera = correo('primera')
    const segunda = correo('segunda')
    await invitar(primera, 'profesional')
    await invitar(segunda, 'familia')
    expect(tokenDe(primera)).not.toBe(tokenDe(segunda))
  })

  it('cada persona entra con su enlace y se queda con el rol con que se la invitó', async () => {
    const psicologa = correo('psicologa')
    const familia = correo('familia')
    await invitar(psicologa, 'profesional')
    await invitar(familia, 'familia')

    expect((await darseDeAlta(psicologa, tokenDe(psicologa)!)).status).toBe(200)
    expect((await darseDeAlta(familia, tokenDe(familia)!)).status).toBe(200)
    expect(await rolesDe(psicologa)).toEqual(['profesional'])
    expect(await rolesDe(familia)).toEqual(['familia'])
  })

  it('la invitación guarda a quién se invitó y con qué rol, para verla como pendiente', async () => {
    const email = correo('pendiente')
    await invitar(email, 'profesional')
    const { docs } = await pendientesDe(email)
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ email, role: 'profesional' })
  })

  it('al aceptarla deja de estar pendiente', async () => {
    const email = correo('acepta')
    await invitar(email)
    await darseDeAlta(email, tokenDe(email)!)
    expect((await pendientesDe(email)).totalDocs).toBe(0)
  })

  it('el correo lleva el enlace a la página de alta', async () => {
    const email = correo('enlace')
    await invitar(email)
    const [mensaje] = emailsTo(email)
    expect(mensaje?.subject).toBe('Invitación al portal de PAFE')
    expect(bodyOf(mensaje!)).toMatch(/\/admin\/signup\?token=[\w-]+&redirect=%2Fforo/)
  })
})

describe('lo que no se envía', () => {
  it('quien ya tiene cuenta no recibe invitación', async () => {
    const existente = await createUser(payload, ['familia'])
    const resultado = await invitar(existente.email.toUpperCase())
    expect(resultado).toEqual([{ email: existente.email, estado: 'ya-tiene-cuenta' }])
    expect(sentEmails).toHaveLength(0)
    expect((await pendientesDe(existente.email)).totalDocs).toBe(0)
  })

  it('lo que no es un correo se avisa y no se envía', async () => {
    const bueno = correo('bueno')
    const resultado = await invitar(`${bueno}, Maider`)
    expect(resultado).toEqual([
      expect.objectContaining({ email: bueno, estado: 'enviada' }),
      { email: 'Maider', estado: 'correo-no-valido' },
    ])
    expect(sentEmails).toHaveLength(1)
  })

  it('volver a invitar a quien está pendiente sustituye su invitación', async () => {
    const email = correo('reenvio')
    await invitar(email)
    const vieja = tokenDe(email)!
    resetEmails()
    await invitar(email)
    const nueva = tokenDe(email)!

    expect(nueva).not.toBe(vieja)
    const { docs } = await pendientesDe(email)
    expect(docs.map((d) => d.token)).toEqual([nueva])
  })

  it('si el correo no sale, no queda una invitación que nadie ha recibido', async () => {
    const email = correo('falla')
    emailFailures.failNextSend = true
    const resultado = await invitar(email)
    expect(resultado).toEqual([expect.objectContaining({ email, estado: 'error' })])
    expect((await pendientesDe(email)).totalDocs).toBe(0)
  })
})

describe('quién puede invitar', () => {
  it('quien no es admin no invita', async () => {
    for (const rol of [['familia'], ['admin-users'], ['profesional']] as const) {
      const alguien = await createUser(payload, [...rol])
      await expect(invitar(correo('x'), 'familia', alguien)).rejects.toMatchObject({
        code: 'sin-permiso',
      })
    }
    expect(sentEmails).toHaveLength(0)
  })

  it('nadie invita con el rol de impersonar', async () => {
    await expect(invitar(correo('x'), 'impersonar')).rejects.toMatchObject({ code: 'sin-permiso' })
  })
})

describe('el panel usa estas invitaciones y no el botón de payload-auth', () => {
  it('la lista de usuarios pinta el formulario propio', () => {
    const descripcion = payload.collections.users.config.admin.components?.Description
    expect(JSON.stringify(descripcion)).toContain('InvitarPersonas')
    expect(JSON.stringify(descripcion)).not.toContain('AdminInviteButton')
  })

  it('las pendientes se listan por correo', () => {
    const config = payload.collections['admin-invitations'].config
    expect(config.admin.useAsTitle).toBe('email')
    expect(config.admin.defaultColumns).toEqual(['email', 'role', 'createdAt'])
  })
})
