import type { CollectionConfig } from 'payload'
import {
  COLLECTION_SLUG_NOTICIA,
  COLLECTION_SLUG_RESPUESTA,
  COLLECTION_SLUG_USER,
} from '@/core/collections-slugs'
import { hiddenUnlessTablon, isActiveUserAccess, isStaffAccess } from '@/core/permissions'
import { autoriaOStaffAccess } from './access'

/**
 * Lo que la gente contesta a una noticia. El foro no se usaba para conversar,
 * pero el tablón sí lo permite: es la vía para responder a un aviso.
 */
export const Respuesta: CollectionConfig = {
  slug: COLLECTION_SLUG_RESPUESTA,
  labels: {
    singular: 'Respuesta',
    plural: 'Respuestas del tablón',
  },
  access: {
    create: isActiveUserAccess,
    // Solo quien la escribió, o el staff cuando hay que retirar algo
    delete: autoriaOStaffAccess,
    read: isActiveUserAccess,
    update: autoriaOStaffAccess,
  },
  admin: {
    group: 'Tablón',
    hidden: hiddenUnlessTablon,
    defaultColumns: ['mensaje', 'noticia', 'author', 'createdAt'],
    useAsTitle: 'mensaje',
  },
  fields: [
    {
      label: 'Mensaje',
      name: 'mensaje',
      type: 'textarea',
      required: true,
    },
    {
      label: 'Noticia',
      name: 'noticia',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_NOTICIA,
      required: true,
      index: true,
    },
    {
      label: 'Autoría',
      name: 'author',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_USER,
      required: true,
      index: true,
      access: {
        // Que nadie pueda escribir a nombre de otro
        update: ({ req }) => isStaffAccess({ req }) as boolean,
      },
    },
  ],
  timestamps: true,
}
