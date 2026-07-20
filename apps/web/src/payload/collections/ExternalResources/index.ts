import { COLLECTION_SLUG_EXTERNAL_RESOURCES, COLLECTION_SLUG_MEDIA } from '@/core/collections-slugs'
import { hiddenUnlessStaff, isActiveUserAccess, isStaffAccess } from '@/core/permissions'
import { buildTaxonomyRelationship } from '@zetesis/payload-taxonomies'
import type { CollectionConfig } from 'payload'

/**
 * Recursos externos del catálogo (vídeos, enlaces web, Google Forms/Docs).
 * También sirven como recursos de tareas.
 */
export const ExternalResources: CollectionConfig = {
  slug: COLLECTION_SLUG_EXTERNAL_RESOURCES,
  labels: {
    singular: 'Recurso Externo',
    plural: 'Recursos Externos',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    // Contenido del catálogo digital: solo usuarios con rol
    read: isActiveUserAccess,
    update: isStaffAccess,
  },
  admin: {
    group: 'Catálogo',
    hidden: hiddenUnlessStaff,
    defaultColumns: ['title', 'type', 'url'],
    useAsTitle: 'title',
  },
  fields: [
    {
      label: 'Caratula',
      name: 'cover',
      type: 'upload',
      relationTo: COLLECTION_SLUG_MEDIA,
    },
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
          label: 'Vídeo',
          value: 'video',
        },
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
    },
    {
      label: 'Duración (minutos)',
      name: 'duration',
      type: 'number',
      required: false,
      admin: {
        description: 'Duración aproximada en minutos (para vídeos)'
      }
    },
    buildTaxonomyRelationship({
      name: 'categories',
      label: 'Categorías',
      defaultValue: [],
    }),
  ],
  timestamps: true,
}