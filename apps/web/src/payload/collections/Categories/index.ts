import { isAdminHidden } from '@/core/permissions'
import { slugField } from '@/payload/fields/slug'
import { taxonomiesCollection } from '@nexo-labs/payload-taxonomies'

export const Categories = taxonomiesCollection({
  fields: [...slugField()],
  admin: {
    hidden: isAdminHidden,
  },
  payloadTypescriptSchema: [
    () => ({
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
}),
  ],
})
