import { COLLECTION_SLUG_EXTERNAL_RESOURCES } from '@/core/collections-slugs'
import { checkRoleHidden } from '@/core/permissions'
import { authenticated } from '@/payload/access/authenticated'
import type { CollectionConfig } from 'payload'

export const ExternalResources: CollectionConfig = {
  slug: COLLECTION_SLUG_EXTERNAL_RESOURCES,
  labels: {
    singular: 'Recurso Externo',
    plural: 'Recursos Externos',
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    hidden: checkRoleHidden("admin"),
    defaultColumns: ['title', 'type', 'url'],
    useAsTitle: 'title',
  },
  fields: [
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      label: 'Descripción',
      name: 'description',
      type: 'textarea',
    },
    {
      label: 'Tipo de Recurso',
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Enlace Web',
          value: 'web_link',
        },
        {
          label: 'Google Form',
          value: 'google-form',
        },
        {
          label: 'Google Doc',
          value: 'google-doc'
        }
      ],
    },
    {
      label: 'URL',
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'URL del recurso externo'
      }
    }
  ],
  timestamps: true,
}