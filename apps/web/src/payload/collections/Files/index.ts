import { COLLECTION_SLUG_FILES } from '@/core/collections-slugs'
import { hiddenUnlessStaff, isStaffAccess } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import { addContentHashToFile } from '@/payload/hooks/addContentHashToFileHook'
import { CollectionConfig } from 'payload'

export const Files: CollectionConfig = {
  slug: COLLECTION_SLUG_FILES,
  labels: {
    singular: 'Fichero',
    plural: 'Ficheros',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    read: authenticated,
    update: isStaffAccess,
  },
  admin: {
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
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
