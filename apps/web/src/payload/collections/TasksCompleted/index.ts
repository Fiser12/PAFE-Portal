import { COLLECTION_SLUG_TASKS_COMPLETED, COLLECTION_SLUG_TASKS, COLLECTION_SLUG_USER, COLLECTION_SLUG_QUESTIONNAIRE_EXECUTIONS } from '@/core/collections-slugs'
import {
  hiddenUnlessAdmin,
  isActiveUser,
  isAdminAccess,
  isStaff,
  staffOrOwnerAccess,
} from '@/core/permissions'
import type { Access, CollectionConfig } from 'payload'

/**
 * Una familia solo puede registrar completaciones a su propio nombre;
 * el staff puede registrarlas para cualquiera.
 */
const createOwnCompletionAccess: Access = ({ req, data }) => {
  if (!req.user) return false
  if (isStaff(req.user)) return true
  if (!isActiveUser(req.user)) return false
  return data?.user !== undefined && String(data.user) === String(req.user.id)
}

export const TasksCompleted: CollectionConfig = {
  slug: COLLECTION_SLUG_TASKS_COMPLETED,
  labels: {
    singular: 'Tarea Completada',
    plural: 'Tareas Completadas',
  },
  access: {
    create: createOwnCompletionAccess,
    // El histórico no se edita; solo un admin corrige errores
    delete: isAdminAccess,
    read: staffOrOwnerAccess('user'),
    update: isAdminAccess,
  },
  admin: {
    hidden: hiddenUnlessAdmin,
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
    {
      label: 'Ejecución de cuestionario',
      name: 'execution',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_QUESTIONNAIRE_EXECUTIONS,
      admin: {
        readOnly: true,
        description: 'Evidencia: ejecución validada que originó esta completación',
      },
    },
  ],
  timestamps: true,
}