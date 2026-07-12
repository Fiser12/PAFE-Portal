import { nextCookies } from 'better-auth/next-js'
import type { Field, FieldHook } from 'payload'
import type { PayloadAuthOptions } from 'payload-auth/better-auth'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import { ADMIN_PANEL_ROLES, ALL_ROLES, ROLE_ADMIN } from '@/core/permissions'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * better-auth inyecta role 'user' (su default) al crear usuarios en el signup
 * OAuth; ese valor no existe en nuestro enum y rompería la validación.
 * Se filtra cualquier valor inválido: el usuario nuevo queda sin rol.
 */
const normalizeRoleValue: FieldHook = ({ value }) => {
  const roles = Array.isArray(value) ? value : value ? [value] : []
  return roles.filter((r) => typeof r === 'string' && (ALL_ROLES as string[]).includes(r))
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
  accounts: { slug: 'accounts' },
  sessions: { slug: 'sessions' },
  verifications: { slug: 'verifications' },

  betterAuthOptions: {
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
    baseURL: getServerSideURL(),
    trustedOrigins: [getServerSideURL()],
    emailAndPassword: {
      enabled: true,
      // Sin auto-registro: las cuentas con contraseña las crea el staff
      disableSignUp: true,
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
