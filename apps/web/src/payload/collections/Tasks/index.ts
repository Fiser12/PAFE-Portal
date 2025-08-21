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
    defaultColumns: ['title', 'case', 'completedOn'],
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
      label: 'Completada en',
      name: 'completedOn',
      type: 'date',
    },
    {
      label: 'Regla de Recurrencia (RRule)',
      name: 'rrule',
      type: 'text',
      admin: {
        description: 'Formato RFC 5545. Ejemplo: FREQ=WEEKLY;INTERVAL=1;BYDAY=MO. Dejar vacío para tareas no recurrentes.',
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