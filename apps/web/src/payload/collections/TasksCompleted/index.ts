import { COLLECTION_SLUG_TASKS_COMPLETED, COLLECTION_SLUG_TASKS, COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import { checkRoleHidden } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import type { CollectionConfig } from 'payload'

export const TasksCompleted: CollectionConfig = {
  slug: COLLECTION_SLUG_TASKS_COMPLETED,
  labels: {
    singular: 'Tarea Completada',
    plural: 'Tareas Completadas',
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
    defaultColumns: ['task', 'user', 'completedOn'],
    useAsTitle: 'id',
  },
  fields: [
    {
      label: 'Tarea',
      name: 'task',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_TASKS,
      required: true,
    },
    {
      label: 'Usuario',
      name: 'user',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_USER,
      required: true,
    },
    {
      label: 'Completada en',
      name: 'completedOn',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime'
        }
      }
    },
  ],
  timestamps: true,
}