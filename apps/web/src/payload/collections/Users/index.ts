import {
  COLLECTION_SLUG_USER,
  COLLECTION_SLUG_CASES,
  COLLECTION_SLUG_GROUPS,
} from '@/core/collections-slugs'
import {
  hiddenUnlessUsuarios,
  isAdminAccess,
  isAdmin,
  isStaff,
  isSuperAdmin,
  usuariosAccess,
  usuariosOrSelfAccess,
} from '@/core/permissions'
import type { FieldAccess } from 'payload'
import type { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_RESERVATION } from '../../../modules/catalog/collections/Reservation'
import {
  cerrarImpersonacionesAlBorrar,
  cerrarImpersonacionesAlPerderElRol,
} from './hooks/cerrarImpersonaciones'
import { limpiarAntesDeBorrar } from './hooks/limpiarAntesDeBorrar'
import { preventPrivilegeEscalation } from './hooks/preventPrivilegeEscalation'
import { cerrarSuInvitacion, rolDeSuInvitacion } from './hooks/rolDeSuInvitacion'

const staffFieldAccess: FieldAccess = ({ req }) => isStaff(req.user)
const superadminFieldAccess: FieldAccess = ({ req }) => isSuperAdmin(req.user)

export const Users: CollectionConfig = {
  slug: COLLECTION_SLUG_USER,
  access: {
    // Panel /admin reservado a Administración
    admin: ({ req }) => isAdmin(req.user),
    // Alta gestionada: el staff crea usuarios desde el panel.
    // El registro con Google usa la Local API (no pasa por aquí) y entra
    // con rol `pendiente` sin acceso a nada.
    create: usuariosAccess,
    delete: isAdminAccess,
    read: usuariosOrSelfAccess,
    // Staff puede editar usuarios (el hook impide tocar admins o escalar
    // roles); el resto solo su propio perfil
    update: usuariosOrSelfAccess,
  },
  hooks: {
    beforeChange: [preventPrivilegeEscalation, rolDeSuInvitacion],
    afterChange: [cerrarImpersonacionesAlPerderElRol, cerrarSuInvitacion],
    beforeDelete: [cerrarImpersonacionesAlBorrar, limpiarAntesDeBorrar],
  },
  admin: {
    hidden: hiddenUnlessUsuarios,
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'impersonar',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/payload/admin_components/Impersonar/Component#ImpersonarField' },
      },
    },
    {
      label: 'Devoluciones tardías',
      name: 'lateReturnsCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      access: { update: staffFieldAccess },
      admin: {
        position: 'sidebar',
        description: 'A partir de la tercera, los préstamos pasan a 14 días durante 6 meses',
      },
    },
    {
      label: 'Penalizada hasta',
      name: 'penalizedUntil',
      type: 'date',
      access: { update: staffFieldAccess },
      admin: {
        position: 'sidebar',
        description: 'Vaciar este campo levanta la penalización (perdón del staff)',
      },
    },
    // name/email/emailVerified/image/role are injected automatically by the
    // better-auth plugin (see src/payload/plugins/better-auth)
    {
      name: 'reservations',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_RESERVATION,
      hasMany: true,
    },
    {
      label: 'Casos Asignados',
      name: 'assignedCases',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_CASES,
      hasMany: true,
      access: { read: superadminFieldAccess, update: superadminFieldAccess },
    },
    {
      label: 'Grupos',
      name: 'groups',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_GROUPS,
      hasMany: true,
      admin: {
        description:
          'lantalde-teknikoa permite acceder al equipo técnico, Catálogo y Wiki. Requiere además un rol activo.',
      },
    },
  ],
  timestamps: true,
}
