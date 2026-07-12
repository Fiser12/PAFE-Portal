import { COLLECTION_SLUG_GROUPS } from '@/core/collections-slugs'
import { hiddenUnlessStaff, isStaffAccess } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import type { CollectionConfig } from 'payload'

/**
 * Grupos dinámicos: los crea el staff y se asignan a usuarios (users.groups).
 * No otorgan permisos — la seguridad se decide con los roles fijos
 * (ver src/core/permissions.ts). Sirven para segmentar usuarios
 * (p. ej. asignar contenidos o tareas a un conjunto de familias).
 */
export const Groups: CollectionConfig = {
  slug: COLLECTION_SLUG_GROUPS,
  labels: {
    singular: 'Grupo',
    plural: 'Grupos',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    read: authenticated,
    update: isStaffAccess,
  },
  admin: {
    hidden: hiddenUnlessStaff,
    useAsTitle: 'name',
    defaultColumns: ['name', 'description'],
  },
  fields: [
    {
      label: 'Nombre',
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      label: 'Descripción',
      name: 'description',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
