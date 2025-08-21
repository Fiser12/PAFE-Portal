import { COLLECTION_SLUG_CASES, COLLECTION_SLUG_TASKS } from '@/core/collections-slugs'
import { checkRoleHidden } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import type { CollectionConfig } from 'payload'

export const Cases: CollectionConfig = {
  slug: COLLECTION_SLUG_CASES,
  labels: {
    singular: 'Caso',
    plural: 'Casos',
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    hidden: checkRoleHidden("admin"),
    defaultColumns: ['title', 'assignedUser', 'createdAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      label: 'Usuario Asignado',
      name: 'assignedUser',
      type: 'join',
      collection: 'users',
      on: "assignedCases"
    },
    {
      label: 'Notas',
      name: 'notes',
      type: 'textarea',
    },
    {
      label: 'Tareas',
      name: 'tasks',
      type: 'join',
      collection: COLLECTION_SLUG_TASKS,
      on: 'case'
    },
  ],
  timestamps: true,
}