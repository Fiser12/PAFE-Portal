import { COLLECTION_SLUG_CASES, COLLECTION_SLUG_TASKS, COLLECTION_SLUG_PDF, COLLECTION_SLUG_FORMS, COLLECTION_SLUG_EXTERNAL_RESOURCES, COLLECTION_SLUG_POSTS } from '@/core/collections-slugs'
import {
  hiddenUnlessStaff,
  isStaffAccess,
  staffOrOwnCaseTasksAccess,
} from '@/core/permissions'
import type { CollectionConfig } from 'payload'

export const Tasks: CollectionConfig = {
  slug: COLLECTION_SLUG_TASKS,
  labels: {
    singular: 'Tarea',
    plural: 'Tareas',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    // El staff ve todas las tareas; una familia solo las de sus casos
    read: staffOrOwnCaseTasksAccess,
    update: isStaffAccess,
  },
  admin: {
    hidden: hiddenUnlessStaff,
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
      hasMany: true,
      admin: {
        position: "sidebar"
      }
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
      label: 'Recursos',
      name: 'resources',
      type: 'relationship',
      relationTo: [COLLECTION_SLUG_PDF, COLLECTION_SLUG_FORMS, COLLECTION_SLUG_EXTERNAL_RESOURCES, COLLECTION_SLUG_POSTS],
      hasMany: true,
      admin: {
        description: 'PDFs, formularios o recursos externos relacionados con esta tarea',
        position: "sidebar"
      }
    },
    {
      label: 'Notas',
      name: 'notes',
      type: 'textarea',
    }

  ],
  timestamps: true,
}