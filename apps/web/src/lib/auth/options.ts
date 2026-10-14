import { APIError, createAuthMiddleware } from 'better-auth/api'
import type { BetterAuthPlugin } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import type { CollectionConfig, Field, FieldHook, Payload } from 'payload'
import type { PayloadAuthOptions } from 'payload-auth/better-auth'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import {
  ADMIN_PANEL_ROLES,
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_ADMIN,
  ROLE_IMPERSONAR,
  hiddenUnlessAdmin,
  hiddenUnlessSuperadmin,
  hiddenUnlessUsuarios,
} from '@/core/permissions'
import {
  ROLES_INVITABLES,
  correoDeInvitacion,
  urlDeInvitacion,
  valeParaElCorreo,
} from '@/modules/invitaciones/domain/invitacion'
import { getServerSideURL } from '@/utilities/getURL'
import { impersonar } from './impersonar'
import { HORAS_DEL_ENLACE, correoDeNuevaClave } from './nuevaClave'
import { payloadDelAuth } from './payloadDelAuth'
import { reenviarInvitacionPendiente } from '@/modules/invitaciones/services'

/**
 * Impersonar solo lo reparte el superadmin desde la ficha: una invitación con
 * ese rol se lo daría a una cuenta nueva sin pasar por el hook de escalada.
 */
const esInvitable = (opcion: unknown) =>
  (typeof opcion === 'string' ? opcion : (opcion as { value?: string })?.value) !== ROLE_IMPERSONAR

const invitacionesPendientes = ({ collection }: { collection: CollectionConfig }) =>
  hideFromStaff({
    collection: {
      ...collection,
      labels: { singular: 'Invitación pendiente', plural: 'Invitaciones pendientes' },
      admin: {
        ...collection.admin,
        useAsTitle: 'email',
        defaultColumns: ['email', 'role', 'createdAt'],
        description: 'Quien acepta su invitación deja de salir aquí y aparece en Usuarios',
      },
      fields: [
        { name: 'email', label: 'Correo', type: 'email', index: true, admin: { readOnly: true } },
        ...collection.fields.map((field) =>
          'name' in field && field.name === 'role' && field.type === 'select'
            ? { ...field, options: field.options.filter(esInvitable) }
            : field,
        ),
      ],
    },
  })

/** El botón «Invite» de payload-auth repite enlace entre invitaciones: se usa el propio */
const conInvitacionesPropias = (admin: CollectionConfig['admin']): CollectionConfig['admin'] => ({
  ...admin,
  components: {
    ...admin?.components,
    Description: {
      path: '@/modules/invitaciones/ui/InvitarPersonas#InvitarPersonas',
      clientProps: {
        roles: ROLES_INVITABLES.map((value) => ({ value, label: ROLE_LABELS[value] ?? value })),
      },
    },
  },
})

/** Las tablas internas de better-auth no le dicen nada a un admin */
const soloSuperadmin = ({ collection }: { collection: CollectionConfig }): CollectionConfig => ({
  ...collection,
  admin: { ...collection.admin, hidden: hiddenUnlessSuperadmin },
})

/** Colecciones técnicas de better-auth: visibles solo para admin en el panel */
const hideFromStaff = ({ collection }: { collection: CollectionConfig }): CollectionConfig => ({
  ...collection,
  admin: { ...collection.admin, hidden: hiddenUnlessAdmin },
})

/**
 * better-auth inyecta role 'user' (su default) al crear usuarios en el signup
 * OAuth; ese valor no existe en nuestro enum y rompería la validación.
 * Se filtra cualquier valor inválido: el usuario nuevo queda sin rol.
 */
const normalizeRoleValue: FieldHook = ({ value }) => {
  const roles = Array.isArray(value) ? value : value ? [value] : []
  return roles.filter((r) => typeof r === 'string' && (ALL_ROLES as string[]).includes(r))
}

const entraConGoogle = async (payload: Payload, userId: string | number) =>
  (
    await payload.count({
      collection: 'accounts',
      where: { and: [{ user: { equals: Number(userId) } }, { providerId: { equals: 'google' } }] },
      overrideAccess: true,
    })
  ).totalDocs > 0

/**
 * Solo se permite el alta con contraseña si llega un token de invitación
 * válido (el formulario de /admin/signup lo manda como query
 * adminInviteToken) y con el correo al que se mandó, para que una errata no
 * deje la cuenta en un buzón que no existe; sin él, el registro queda cerrado.
 * Réplica del middleware de requireAdminInviteForSignUp del plugin, que no se puede
 * activar directamente: esa opción además desactiva el alta implícita con
 * Google, que aquí es deliberada.
 *
 * Va como plugin y no en `hooks.before`: si alguien añade el plugin admin de
 * better-auth, payload-auth envuelve ese hook y devuelve su resultado, que
 * better-auth toma como respuesta de todas las rutas (nadie podría entrar).
 */
const soloConInvitacion = (): BetterAuthPlugin => ({
  id: 'pafe-solo-con-invitacion',
  hooks: {
    before: [
      {
        matcher: (ctx) => ctx.path === '/sign-up/email',
        handler: createAuthMiddleware(async (ctx) => {
          const token =
            ctx.headers?.get('x-admin-invite-token') ??
            ctx.query?.adminInviteToken ??
            ctx.body?.adminInviteToken
          const invitacion =
            typeof token === 'string' && token.length > 0
              ? await ctx.context.adapter.findOne<{ email?: string | null }>({
                  model: 'admin-invitations',
                  where: [{ field: 'token', operator: 'eq', value: token }],
                })
              : null
          if (!invitacion) {
            throw new APIError('UNAUTHORIZED', { message: 'signup disabled' })
          }
          if (!valeParaElCorreo(invitacion, String(ctx.body?.email ?? ''))) {
            throw new APIError('FORBIDDEN', {
              message:
                'Este enlace es para otro correo: escribe el correo en el que recibiste la invitación',
            })
          }
        }),
      },
    ],
  },
})

/**
 * Quien todavía no ha creado su cuenta y pide «olvidé mi contraseña» no
 * recibiría nada (better-auth no avisa de que la cuenta no existe). Si tiene
 * una invitación pendiente, se le reenvía.
 */
const invitacionAlPedirEnlace = (): BetterAuthPlugin => ({
  id: 'pafe-invitacion-al-pedir-enlace',
  hooks: {
    before: [
      {
        matcher: (ctx) => ctx.path === '/request-password-reset',
        handler: createAuthMiddleware(async (ctx) => {
          const email = ctx.body?.email
          if (typeof email !== 'string') return
          try {
            await reenviarInvitacionPendiente(await payloadDelAuth(), email)
          } catch (error) {
            console.error('[auth] No se pudo reenviar la invitación pendiente', error)
          }
        }),
      },
    ],
  },
})

export const betterAuthPluginOptions: PayloadAuthOptions = {
  users: {
    slug: COLLECTION_SLUG_USER,
    // Roles fijos del sistema. Los grupos dinámicos son la colección `groups`
    // y complementan el acceso al contenido del equipo técnico.
    roles: ALL_ROLES,
    adminRoles: ADMIN_PANEL_ROLES,
    defaultAdminRole: ROLE_ADMIN,
    collectionOverrides: ({ collection }) => ({
      ...collection,
      // payload-auth pisa el `hidden` de la colección con el suyo
      admin: { ...conInvitacionesPropias(collection.admin), hidden: hiddenUnlessUsuarios },
      fields: collection.fields.map((field) =>
        'name' in field && field.name === 'role'
          ? ({
              ...field,
              // Todo usuario nuevo (incluido el alta abierta con Google) nace
              // SIN rol: no tiene acceso a nada hasta que el staff se lo
              // asigne a mano. No usar defaultRole del plugin: pondría un
              // valor con permisos.
              defaultValue: [],
              required: false,
              options: ALL_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] ?? value })),
              hooks: {
                beforeValidate: [normalizeRoleValue],
              },
            } as Field)
          : field,
      ),
    }),
  },
  accounts: { slug: 'accounts', collectionOverrides: soloSuperadmin },
  sessions: { slug: 'sessions', collectionOverrides: soloSuperadmin },
  verifications: { slug: 'verifications', collectionOverrides: soloSuperadmin },
  pluginCollectionOverrides: {
    invitations: hideFromStaff,
  },
  adminInvitations: {
    collectionOverrides: invitacionesPendientes,
    // Sin serverURL en payload.config, el default del plugin genera una ruta
    // relativa (/admin/signup?token=...) y el enlace llega roto en el correo
    generateInviteUrl: ({ token }) => urlDeInvitacion(getServerSideURL(), token),
    // Requerido por el endpoint de invitaciones del plugin, aunque el panel ya no lo use
    sendInviteEmail: async ({ payload, email, url }) => {
      try {
        await payload.sendEmail({ to: email, ...correoDeInvitacion(url) })
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Error enviando la invitación',
        }
      }
    },
  },

  betterAuthOptions: {
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
    baseURL: getServerSideURL(),
    trustedOrigins: [getServerSideURL()],
    emailAndPassword: {
      enabled: true,
      // OJO: no usar disableSignUp aquí — bloquearía también a los invitados
      // desde /admin/signup ("Email and password sign up is not enabled").
      // El alta abierta con contraseña se bloquea en soloConInvitacion (arriba).
      // Cubre tanto "olvidé mi contraseña" como el alta gestionada: el staff
      // crea la cuenta y el usuario establece su contraseña desde este enlace
      resetPasswordTokenExpiresIn: HORAS_DEL_ENLACE * 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        const payload = await payloadDelAuth()
        await payload.sendEmail({
          to: user.email,
          ...correoDeNuevaClave({
            nombre: user.name,
            url,
            conGoogle: await entraConGoogle(payload, user.id),
          }),
        })
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.AUTH_CLIENT_ID as string,
        clientSecret: process.env.AUTH_CLIENT_SECRET as string,
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        // Un usuario dado de alta por el staff con su email puede entrar
        // después con Google (mismo email verificado) y se enlazan las cuentas
        trustedProviders: ['google'],
      },
    },
    plugins: [
      soloConInvitacion(),
      invitacionAlPedirEnlace(),
      impersonar(),
      nextCookies(),
    ],
  },
}
