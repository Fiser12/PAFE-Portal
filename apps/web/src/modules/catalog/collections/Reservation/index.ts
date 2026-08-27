import { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_CATALOG_ITEM } from '../CatalogItem'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import {
  hiddenUnlessStaff,
  isActiveUserAccess,
  isAdminAccess,
  isStaffAccess,
  staffOrOwnerAccess,
} from '@/core/permissions'

export const COLLECTION_SLUG_RESERVATION = 'reservation'

export const Reservation: CollectionConfig = {
  slug: COLLECTION_SLUG_RESERVATION,
  labels: {
    singular: 'Reserva',
    plural: 'Reservas',
  },
  access: {
    // Familias y staff solicitan; un usuario `pendiente` no puede reservar
    create: isActiveUserAccess,
    // El ciclo de vida se cierra con estados, no borrando: borrar es limpieza
    delete: isAdminAccess,
    read: staffOrOwnerAccess('user'),
    update: isStaffAccess,
  },
  admin: {
    group: 'Catálogo',
    hidden: hiddenUnlessStaff,
    defaultColumns: ['item', 'user', 'status', 'dueDate'],
    components: {
      views: {
        list: {
          actions: [],
        },
      },
    },
  },
  fields: [
    {
      label: 'Elemento',
      name: 'item',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_CATALOG_ITEM,
      required: true,
      hasMany: false,
    },
    {
      label: 'Usuario',
      name: 'user',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_USER,
      required: true,
      hasMany: false,
    },
    {
      label: 'Estado',
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'reservada',
      options: [
        { label: 'Reservada (pendiente de recoger)', value: 'reservada' },
        { label: 'En préstamo', value: 'activa' },
        { label: 'Devuelta', value: 'devuelta' },
        { label: 'Perdida o rota', value: 'perdida' },
        { label: 'Cancelada', value: 'cancelada' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Fecha de reserva',
      name: 'reservationDate',
      type: 'date',
      required: true,
    },
    {
      label: 'Fecha de recogida',
      name: 'pickupDate',
      type: 'date',
      admin: {
        description: 'Martes de reunión en que la familia recoge el material',
      },
    },
    {
      label: 'Fecha de devolución prevista',
      name: 'dueDate',
      type: 'date',
      admin: {
        description: 'Recogida + 28 días (14 si la familia está penalizada)',
      },
    },
    {
      label: 'Prórroga',
      name: 'extension',
      type: 'group',
      fields: [
        {
          label: 'Solicitada el',
          name: 'requestedAt',
          type: 'date',
        },
      ],
    },
    {
      label: 'Devuelto el',
      name: 'returnedAt',
      type: 'date',
    },
    {
      label: 'Devolución tardía',
      name: 'returnedLate',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      label: 'Pérdida o rotura',
      name: 'loss',
      type: 'group',
      fields: [
        {
          label: 'Comunicada el',
          name: 'reportedAt',
          type: 'date',
        },
        {
          label: 'Límite de reposición',
          name: 'replacementDeadline',
          type: 'date',
        },
        {
          label: 'Repuesto el',
          name: 'replacedAt',
          type: 'date',
        },
      ],
    },
    {
      label: 'Justificación del cupo excepcional',
      name: 'quotaOverrideReason',
      type: 'textarea',
      admin: {
        description: 'Obligatoria cuando el staff supera el máximo de 2 materiales por familia',
      },
    },
    {
      label: 'Aviso previo enviado para el vencimiento',
      name: 'reminderSentFor',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Evita repetir el aviso de los 5 días; una prórroga habilita uno nuevo',
      },
    },
    {
      label: 'Aviso del día enviado para el vencimiento',
      name: 'dueNoticeSentFor',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Evita repetir el aviso del propio día del vencimiento',
      },
    },
  ],
  timestamps: true,
}
