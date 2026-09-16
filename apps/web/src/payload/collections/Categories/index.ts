import { hiddenUnlessCatalogo } from '@/core/permissions'
import { taxonomiesCollection } from '@zetesis/payload-taxonomies'

export const Categories = taxonomiesCollection({
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  admin: {
    hidden: hiddenUnlessCatalogo,
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
