import {
  COLLECTION_SLUG_USER,
  COLLECTION_SLUG_CASES,
  COLLECTION_SLUG_GROUPS,
} from '@/core/collections-slugs'
import {
  hiddenUnlessStaff,
  isAdminAccess,
  isStaff,
  isStaffAccess,
  staffOrSelfAccess,
} from '@/core/permissions'
import type { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_RESERVATION } from '../../../modules/catalog/collections/Reservation'
import { preventPrivilegeEscalation } from './hooks/preventPrivilegeEscalation'

export const Users: CollectionConfig = {
  slug: COLLECTION_SLUG_USER,
  access: {
    // Panel /admin solo para staff (admin y profesional)
    admin: ({ req }) => isStaff(req.user),
    // Alta gestionada: el staff crea usuarios desde el panel.
    // El registro con Google usa la Local API (no pasa por aquí) y entra
    // con rol `pendiente` sin acceso a nada.
    create: isStaffAccess,
    delete: isAdminAccess,
    read: staffOrSelfAccess,
    // Staff puede editar usuarios (el hook impide tocar admins o escalar
    // roles); el resto solo su propio perfil
    update: staffOrSelfAccess,
  },
  hooks: {
    beforeChange: [preventPrivilegeEscalation],
  },
  admin: {
    hidden: hiddenUnlessStaff,
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
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
    },
    {
      label: 'Grupos',
      name: 'groups',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_GROUPS,
      hasMany: true,
      admin: {
        description:
          'Grupos dinámicos a los que pertenece el usuario (no otorgan permisos)',
      },
    },
  ],
  timestamps: true,
}
