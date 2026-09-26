import { COLLECTION_SLUG_GROUPS } from '@/core/collections-slugs'
import { hiddenUnlessAdmin, isAdminAccess } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import type { CollectionConfig } from 'payload'

/** Los grupos organizan personas; lantalde-teknikoa identifica a los psicólogos. */
export const Groups: CollectionConfig = {
  slug: COLLECTION_SLUG_GROUPS,
  labels: {
    singular: 'Grupo de usuarios',
    plural: 'Grupos de usuarios',
  },
  access: {
    create: isAdminAccess,
    delete: isAdminAccess,
    read: authenticated,
    update: isAdminAccess,
  },
  admin: {
    group: 'Auth',
    hidden: hiddenUnlessAdmin,
    useAsTitle: 'name',
    description:
      'lantalde-teknikoa: psicólogos del equipo técnico. Las familias no pertenecen a este grupo. Se asigna desde la ficha de cada usuario.',
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
