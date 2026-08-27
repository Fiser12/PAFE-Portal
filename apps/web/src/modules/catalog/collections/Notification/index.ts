import { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import { hiddenUnlessStaff, isAdminAccess, isStaffAccess, staffOrOwnerAccess } from '@/core/permissions'
import { NOTIFICATION_TYPES } from '../../domain/notifications'
import { COLLECTION_SLUG_RESERVATION } from '../Reservation'

export const COLLECTION_SLUG_NOTIFICATION = 'notification'

export const Notification: CollectionConfig = {
  slug: COLLECTION_SLUG_NOTIFICATION,
  labels: {
    singular: 'Aviso',
    plural: 'Avisos',
  },
  access: {
    // Las crean los servicios del préstamo, nunca quien las recibe
    create: isStaffAccess,
    delete: isAdminAccess,
    read: staffOrOwnerAccess('user'),
    update: isStaffAccess,
  },
  admin: {
    group: 'Catálogo',
    hidden: hiddenUnlessStaff,
    defaultColumns: ['user', 'type', 'createdAt', 'readAt'],
    useAsTitle: 'type',
  },
  fields: [
    {
      label: 'Usuario',
      name: 'user',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_USER,
      required: true,
      hasMany: false,
      index: true,
    },
    {
      label: 'Tipo',
      name: 'type',
      type: 'select',
      required: true,
      options: NOTIFICATION_TYPES.map((value) => ({ label: value, value })),
    },
    {
      label: 'Mensaje',
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      label: 'Reserva',
      name: 'reservation',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_RESERVATION,
      hasMany: false,
    },
    {
      label: 'Leído el',
      name: 'readAt',
      type: 'date',
    },
  ],
  timestamps: true,
}
