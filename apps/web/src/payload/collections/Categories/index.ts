import { hiddenUnlessStaff } from '@/core/permissions'
import { taxonomiesCollection } from '@zetesis/payload-taxonomies'

export const Categories = taxonomiesCollection({
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  admin: {
    hidden: hiddenUnlessStaff,
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
