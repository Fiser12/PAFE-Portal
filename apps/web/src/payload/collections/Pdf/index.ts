import { COLLECTION_SLUG_PDF } from '@/core/collections-slugs'
import { checkRoleHidden } from '@/core/permissions'
import { addContentHashToFile } from '@/payload/hooks/addContentHashToFileHook'
import { CollectionConfig } from 'payload'

export const Pdf: CollectionConfig = {
  slug: COLLECTION_SLUG_PDF,
  labels: {
    singular: 'PDF',
    plural: 'PDFs',
  },
  admin: {
    hidden: checkRoleHidden("admin"),
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
  fields: [
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
