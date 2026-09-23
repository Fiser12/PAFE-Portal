import type { Field } from 'payload'
import { isAdmin } from '@/core/permissions'

export const camposDeOrigen = (idField: 'sourceTopicId' | 'sourcePostId'): Field[] => [
  {
    name: idField,
    label: 'Identificador original de NodeBB',
    type: 'number',
    unique: true,
    admin: { readOnly: true, position: 'sidebar' },
    access: { create: ({ req }) => isAdmin(req.user), update: ({ req }) => isAdmin(req.user) },
  },
  {
    name: 'sourceAuthor',
    label: 'Autoría original',
    type: 'text',
    admin: { readOnly: true, position: 'sidebar' },
    access: { create: ({ req }) => isAdmin(req.user), update: ({ req }) => isAdmin(req.user) },
  },
  {
    name: 'sourceAuthorId',
    label: 'Autor original en NodeBB',
    type: 'number',
    admin: { readOnly: true, position: 'sidebar' },
    access: { create: ({ req }) => isAdmin(req.user), update: ({ req }) => isAdmin(req.user) },
  },
]
