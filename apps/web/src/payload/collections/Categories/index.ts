import { checkRoleHidden } from '@/core/permissions'
import { slugField } from '@/payload/fields/slug'
import { taxonomiesCollection } from '@nexo-labs/payload-taxonomies'

export const Categories = taxonomiesCollection({
  fields: [...slugField()],
  admin: {
    hidden: checkRoleHidden("admin"),
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
