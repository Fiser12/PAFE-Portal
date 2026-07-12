import { COLLECTION_SLUG_FILES, COLLECTION_SLUG_MEDIA } from '@/core/collections-slugs'
import { hiddenUnlessStaff, isActiveUserAccess, isStaffAccess } from '@/core/permissions'
import { addContentHashToFile } from '@/payload/hooks/addContentHashToFileHook'
import { buildTaxonomyRelationship } from '@zetesis/payload-taxonomies'
import { CollectionConfig } from 'payload'

/**
 * Materiales descargables del catálogo (ebooks, guías, documentos).
 * También sirven como recursos adjuntos de tareas.
 */
export const Files: CollectionConfig = {
  slug: COLLECTION_SLUG_FILES,
  labels: {
    singular: 'Material descargable',
    plural: 'Materiales descargables',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    // Contenido del catálogo digital: solo usuarios con rol
    read: isActiveUserAccess,
    update: isStaffAccess,
  },
  admin: {
    group: 'Catálogo',
    hidden: hiddenUnlessStaff,
    useAsTitle: 'title',
    components: {
      views: {
        list: {
          actions: [],
        },
      },
    },
  },
  hooks: {
    beforeOperation: [addContentHashToFile],
  },
  upload: {
    // Solo documentos: nada de ejecutables, vídeo o audio
    mimeTypes: [
      'application/pdf',
      'application/epub+zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/plain',
    ],
  },
  fields: [
    {
      label: 'Caratula',
      name: 'cover',
      type: 'upload',
      relationTo: COLLECTION_SLUG_MEDIA,
    },
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
    buildTaxonomyRelationship({
      name: 'categories',
      label: 'Categorías',
      defaultValue: [],
    }),
  ],
}
