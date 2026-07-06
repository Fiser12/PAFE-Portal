import { checkRoleHidden } from '@/core/permissions'
import { taxonomiesCollection } from '@zetesis/payload-taxonomies'

export const Categories = taxonomiesCollection({
  admin: {
    hidden: checkRoleHidden('admin'),
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
