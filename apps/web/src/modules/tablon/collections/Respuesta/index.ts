import type { CollectionConfig } from 'payload'
import {
  COLLECTION_SLUG_NOTICIA,
  COLLECTION_SLUG_RESPUESTA,
  COLLECTION_SLUG_USER,
} from '@/core/collections-slugs'
import { hiddenUnlessTablon, isStaffAccess } from '@/core/permissions'
import { autoriaOStaffAccess } from './access'
import { crearRespuesta, leerRespuesta } from '../access'
import { camposDeOrigen } from '../origen'
import { lexicalDelTablon } from '../../ui/lexicalDelTablon'

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
    create: crearRespuesta,
    // Solo quien la escribió, o el staff cuando hay que retirar algo
    delete: autoriaOStaffAccess,
    read: leerRespuesta,
    update: autoriaOStaffAccess,
  },
  admin: {
    group: 'Tablón',
    hidden: hiddenUnlessTablon,
    defaultColumns: ['mensaje', 'noticia', 'author', 'createdAt'],
    useAsTitle: 'mensaje',
  },
  fields: [
    ...camposDeOrigen('sourcePostId'),
    { name: 'body', label: 'Contenido original', type: 'richText', editor: lexicalDelTablon },
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
      index: true,
      access: {
        // Que nadie pueda escribir a nombre de otro
        update: ({ req }) => isStaffAccess({ req }) as boolean,
      },
    },
  ],
  timestamps: true,
}
