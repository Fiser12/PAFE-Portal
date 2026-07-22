import type { Block } from 'payload'

export const QuestionnaireResource: Block = {
  slug: 'questionnaireResource',
  interfaceName: 'QuestionnaireResourceBlock',
  labels: {
    singular: 'Recurso del catálogo',
    plural: 'Recursos del catálogo',
  },
  fields: [
    {
      name: 'resource',
      label: 'Recurso',
      type: 'relationship',
      relationTo: 'search',
      required: true,
      admin: {
        components: {
          Field:
            '@/payload/admin_components/QuestionnaireResource/Component#QuestionnaireResourceField',
        },
      },
    },
  ],
}
