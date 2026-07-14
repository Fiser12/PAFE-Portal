import { nextCookies } from 'better-auth/next-js'
import type { CollectionConfig, Field, FieldHook } from 'payload'
import type { PayloadAuthOptions } from 'payload-auth/better-auth'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import {
  ADMIN_PANEL_ROLES,
  ALL_ROLES,
  ROLE_ADMIN,
  hiddenUnlessAdmin,
} from '@/core/permissions'
import { getServerSideURL } from '@/utilities/getURL'

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

/**
 * Envía email a través del adaptador de Payload (Resend en prod, consola en
 * dev). Imports dinámicos para no crear un ciclo: este fichero forma parte del
 * payload.config y en el momento del envío payload ya está inicializado.
 */
const sendAuthEmail = async (to: string, subject: string, html: string) => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  await payload.sendEmail({ to, subject, html })
}

export const betterAuthPluginOptions: PayloadAuthOptions = {
  users: {
    slug: COLLECTION_SLUG_USER,
    // Roles fijos del sistema. Los grupos dinámicos son la colección `groups`
    // y no otorgan permisos.
    roles: ALL_ROLES,
    adminRoles: ADMIN_PANEL_ROLES,
    defaultAdminRole: ROLE_ADMIN,
    collectionOverrides: ({ collection }) => ({
      ...collection,
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
              hooks: {
                beforeValidate: [normalizeRoleValue],
              },
            } as Field)
          : field,
      ),
    }),
  },
  accounts: { slug: 'accounts', collectionOverrides: hideFromStaff },
  sessions: { slug: 'sessions', collectionOverrides: hideFromStaff },
  verifications: { slug: 'verifications', collectionOverrides: hideFromStaff },
  pluginCollectionOverrides: {
    invitations: hideFromStaff,
  },
  adminInvitations: {
    collectionOverrides: hideFromStaff,
    // Sin serverURL en payload.config, el default del plugin genera una ruta
    // relativa (/admin/signup?token=...) y el enlace llega roto en el correo
    generateInviteUrl: ({ token }) => `${getServerSideURL()}/admin/signup?token=${token}`,
    // Requerido por el botón "Invite" del panel de admin: sin esta función el
    // endpoint del plugin responde 500 ("Send invite email function not found")
    sendInviteEmail: async ({ payload, email, url }) => {
      try {
        await payload.sendEmail({
          to: email,
          subject: 'Invitación al portal de PAFE',
          html: `<p>Hola,</p>
           <p>Has recibido una invitación para unirte al portal de PAFE. Pulsa el siguiente enlace para crear tu cuenta:</p>
           <p><a href="${url}">Aceptar invitación</a></p>
           <p>Si no esperabas este correo, puedes ignorarlo.</p>`,
        })
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
      // Sin auto-registro: las cuentas con contraseña las crea el staff
      disableSignUp: true,
      // Cubre tanto "olvidé mi contraseña" como el alta gestionada: el staff
      // crea la cuenta y el usuario establece su contraseña desde este enlace
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail(
          user.email,
          'Establece tu contraseña — PAFE',
          `<p>Hola${user.name ? ` ${user.name}` : ''},</p>
           <p>Pulsa el siguiente enlace para establecer tu contraseña en el portal de PAFE:</p>
           <p><a href="${url}">Establecer contraseña</a></p>
           <p>El enlace caduca en 1 hora. Si no has solicitado este correo, puedes ignorarlo.</p>`,
        )
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
    plugins: [nextCookies()],
  },
}
