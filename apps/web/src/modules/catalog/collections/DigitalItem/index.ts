import { hiddenUnlessStaff, isActiveUserAccess, isStaffAccess } from '@/core/permissions'
import { buildTaxonomyRelationship } from '@zetesis/payload-taxonomies'
import { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_FILES, COLLECTION_SLUG_MEDIA } from '@/core/collections-slugs'

export const COLLECTION_SLUG_DIGITAL_ITEM = 'digital-item'

/**
 * Materiales digitales del catálogo: vídeos (enlace externo) y
 * ebooks/descargables. No se reservan — acceso directo, pero solo
 * para usuarios con rol asignado (familia o staff).
 */
export const DigitalItem: CollectionConfig = {
  slug: COLLECTION_SLUG_DIGITAL_ITEM,
  labels: {
    singular: 'Material digital',
    plural: 'Materiales digitales',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    // Solo usuarios con algún rol pueden ver los materiales digitales
    read: isActiveUserAccess,
    update: isStaffAccess,
  },
  admin: {
    group: 'Catálogo',
    hidden: hiddenUnlessStaff,
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'updatedAt'],
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
      label: 'Tipo de material',
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Vídeo', value: 'video' },
        { label: 'Ebook / descargable', value: 'ebook' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Descripción',
      name: 'description',
      type: 'textarea',
    },
    {
      label: 'URL del vídeo',
      name: 'url',
      type: 'text',
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'video',
        description: 'Enlace externo al vídeo (no se aloja en el portal)',
      },
      validate: (value: string | null | undefined, { siblingData }: { siblingData?: unknown }) =>
        (siblingData as { type?: string })?.type === 'video' && !value
          ? 'La URL del vídeo es obligatoria'
          : true,
    },
    {
      label: 'Archivo',
      name: 'file',
      type: 'upload',
      relationTo: COLLECTION_SLUG_FILES,
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'ebook',
        description: 'PDF o documento descargable',
      },
    },
    buildTaxonomyRelationship({
      name: 'categories',
      label: 'Categorías',
      required: true,
      defaultValue: []
    }),
  ],
  timestamps: true,
}
