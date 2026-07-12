import { COLLECTION_SLUG_CASES, COLLECTION_SLUG_TASKS } from '@/core/collections-slugs'
import {
  hiddenUnlessAdmin,
  isStaffAccess,
  staffOrOwnCasesAccess,
} from '@/core/permissions'
import type { CollectionConfig } from 'payload'

export const Cases: CollectionConfig = {
  slug: COLLECTION_SLUG_CASES,
  labels: {
    singular: 'Caso',
    plural: 'Casos',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    // El staff ve todos los casos; una familia solo los suyos
    read: staffOrOwnCasesAccess,
    update: isStaffAccess,
  },
  admin: {
    hidden: hiddenUnlessAdmin,
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