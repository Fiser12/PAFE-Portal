import { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_CATALOG_ITEM } from '../CatalogItem'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import { checkRoleHidden } from '@/core/permissions'

export const COLLECTION_SLUG_RESERVATION = 'reservation'

export const Reservation: CollectionConfig = {
  slug: COLLECTION_SLUG_RESERVATION,
  labels: {
    singular: 'Reserva',
    plural: 'Reservas',
  },
  admin: {
    group: 'Catálogo',
    hidden: checkRoleHidden("catalog-admin"),
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
        hasMany: false
    },
    {
        label: 'Usuario',
        name: 'user',
        type: 'relationship',
        relationTo: COLLECTION_SLUG_USER,
        required: true,
        hasMany: false
    },
    {
        label: 'Fecha de reserva',
        name: 'reservationDate',
        type: 'date',
        required: true,
    }
  ],
}
