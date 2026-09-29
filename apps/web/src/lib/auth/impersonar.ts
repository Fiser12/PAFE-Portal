import type { BetterAuthPlugin } from 'better-auth'
import { APIError, createAuthEndpoint, sessionMiddleware } from 'better-auth/api'
import { deleteSessionCookie, expireCookie, setSessionCookie } from 'better-auth/cookies'
import { puedeImpersonar, puedeImpersonarA } from '@/core/permissions'

const UNA_HORA = 60 * 60 * 1000

/** La cookie donde se guarda la sesión propia mientras se es otra persona */
const COOKIE_PROPIA = 'admin_session'

/** Lo que necesitan las reglas de permisos de un usuario de better-auth */
const paraPermisos = (usuario: { email: string } & Record<string, unknown>) => ({
  email: usuario.email,
  role: usuario.role,
})

const idDe = (valor: unknown): string | null => {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'object' && 'id' in valor) return String((valor as { id: unknown }).id)
  return String(valor)
}

/**
 * El mecanismo del plugin admin de better-auth sin ese plugin: con payload-auth
 * 1.9 sus comprobaciones fallan con roles en array y abre endpoints para
 * cambiar roles saltándose el panel.
 */
export const impersonar = (): BetterAuthPlugin => ({
  id: 'pafe-impersonar',
  schema: {
    session: {
      fields: {
        impersonatedBy: {
          type: 'string',
          required: false,
          references: { model: 'user', field: 'id' },
        },
      },
    },
  },
  endpoints: {
    iniciarImpersonacion: createAuthEndpoint(
      '/impersonar/iniciar',
      { method: 'POST', use: [sessionMiddleware] },
      async (ctx) => {
        const propia = ctx.context.session
        if (!puedeImpersonar(paraPermisos(propia.user)) || idDe(propia.session.impersonatedBy)) {
          throw new APIError('FORBIDDEN', { message: 'No puedes impersonar usuarios' })
        }

        const objetivo = await ctx.context.internalAdapter.findUserById(
          String((ctx.body as { userId?: unknown } | undefined)?.userId ?? ''),
        )
        if (!objetivo) throw new APIError('NOT_FOUND', { message: 'No existe esa persona' })
        if (!puedeImpersonarA(paraPermisos(propia.user), paraPermisos(objetivo))) {
          throw new APIError('FORBIDDEN', { message: 'No puedes entrar como esta persona' })
        }

        const sesion = await ctx.context.internalAdapter.createSession(
          objetivo.id,
          true,
          { impersonatedBy: propia.user.id, expiresAt: new Date(Date.now() + UNA_HORA) },
          true,
        )
        if (!sesion) throw new APIError('INTERNAL_SERVER_ERROR')

        const noRecordar = await ctx.getSignedCookie(
          ctx.context.authCookies.dontRememberToken.name,
          ctx.context.secret,
        )
        deleteSessionCookie(ctx)
        await ctx.setSignedCookie(
          ctx.context.createAuthCookie(COOKIE_PROPIA).name,
          `${propia.session.token}:${noRecordar || ''}`,
          ctx.context.secret,
          ctx.context.authCookies.sessionToken.attributes,
        )
        await setSessionCookie(ctx, { session: sesion, user: objetivo }, true)
        return ctx.json({ userId: objetivo.id })
      },
    ),

    terminarImpersonacion: createAuthEndpoint(
      '/impersonar/terminar',
      { method: 'POST', use: [sessionMiddleware] },
      async (ctx) => {
        const actual = ctx.context.session
        const quien = idDe(actual.session.impersonatedBy)
        if (!quien) throw new APIError('BAD_REQUEST', { message: 'No estás impersonando a nadie' })

        const cookie = ctx.context.createAuthCookie(COOKIE_PROPIA)
        const guardada = await ctx.getSignedCookie(cookie.name, ctx.context.secret)
        const [token = '', noRecordar] = (guardada || '').split(':')
        const propia = token ? await ctx.context.internalAdapter.findSession(token) : null
        if (!propia || idDe(propia.session.userId) !== quien) {
          throw new APIError('BAD_REQUEST', { message: 'No se encuentra tu sesión' })
        }

        await ctx.context.internalAdapter.deleteSession(actual.session.token)
        await setSessionCookie(ctx, propia, Boolean(noRecordar))
        expireCookie(ctx, cookie)
        return ctx.json({ userId: propia.user.id })
      },
    ),
  },
})
