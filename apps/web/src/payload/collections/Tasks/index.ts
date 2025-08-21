import { COLLECTION_SLUG_CASES, COLLECTION_SLUG_TASKS } from '@/core/collections-slugs'
import { checkRoleHidden } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import type { CollectionConfig } from 'payload'

export const Tasks: CollectionConfig = {
  slug: COLLECTION_SLUG_TASKS,
  labels: {
    singular: 'Tarea',
    plural: 'Tareas',
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
    defaultColumns: ['title', 'case'],
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
      label: 'Caso',
      name: 'case',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_CASES,
      required: true,
      hasMany: true
    },
    {
      label: 'Regla de Recurrencia (RRule)',
      name: 'rrule',
      type: 'json',
      admin: {
        components: {
          Field: '@/payload/admin_components/RRule/Component#RRuleField'
        }
      },
    },
    {
      label: 'Notas',
      name: 'notes',
      type: 'textarea',
    }

  ],
  timestamps: true,
}