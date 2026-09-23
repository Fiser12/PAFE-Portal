import type { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_ADJUNTO } from '@/core/collections-slugs'
import { hiddenUnlessTablon, tablonAccess } from '@/core/permissions'
import { leerAdjunto } from '../access'
import { AREAS_DEL_TABLON } from '../../domain/areas'

/**
 * Lo que se incrusta en una noticia. Va aparte de `files` a propósito: allí
 * está el fondo documental que sale en el catálogo, y el orden del día de una
 * reunión no es material del catálogo.
 */
export const Adjunto: CollectionConfig = {
  slug: COLLECTION_SLUG_ADJUNTO,
  labels: {
    singular: 'Adjunto del tablón',
    plural: 'Adjuntos del tablón',
  },
  access: {
    create: tablonAccess,
    delete: tablonAccess,
    read: leerAdjunto,
    update: tablonAccess,
  },
  admin: {
    group: 'Tablón',
    hidden: hiddenUnlessTablon,
    defaultColumns: ['filename', 'mimeType', 'createdAt'],
  },
  upload: {
    // Lo que de verdad se ha subido al foro: pdf y doc sobre todo, imágenes, y
    // algún vídeo suelto
    mimeTypes: [
      'application/pdf',
      'application/msword',
      // Los .doc y .xls antiguos se detectan por su contenedor binario OLE.
      'application/x-cfb',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
    ],
  },
  fields: [
    {
      name: 'sourceKey',
      label: 'Origen de la importación',
      type: 'text',
      unique: true,
      admin: { readOnly: true },
    },
    { name: 'area', label: 'Área', type: 'select', options: [...AREAS_DEL_TABLON], index: true },
    {
      label: 'Texto alternativo',
      name: 'alt',
      type: 'text',
      localized: true,
      admin: {
        description: 'Para quien no puede ver la imagen. En documentos y vídeos no hace falta',
      },
    },
  ],
  timestamps: true,
}
