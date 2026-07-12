import { COLLECTION_SLUG_PDF } from '@/core/collections-slugs'
import { hiddenUnlessStaff, isStaffAccess } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import { addContentHashToFile } from '@/payload/hooks/addContentHashToFileHook'
import { CollectionConfig } from 'payload'

export const Pdf: CollectionConfig = {
  slug: COLLECTION_SLUG_PDF,
  labels: {
    singular: 'PDF',
    plural: 'PDFs',
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
  fields: [
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
