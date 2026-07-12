import { hiddenUnlessStaff, isStaffAccess } from '@/core/permissions'
import { anyone } from '@/payload/access/anyone'
import { buildTaxonomyRelationship } from '@zetesis/payload-taxonomies'
import { CollectionConfig } from 'payload'

export const COLLECTION_SLUG_CATALOG_ITEM = 'catalog-item'

export const CatalogItem: CollectionConfig = {
  slug: COLLECTION_SLUG_CATALOG_ITEM,
  labels: {
    singular: 'Material reservable',
    plural: 'Catálogo reservable',
  },
  access: {
    // El catálogo es visible públicamente; solo el staff lo gestiona
    create: isStaffAccess,
    delete: isStaffAccess,
    read: anyone,
    update: isStaffAccess,
  },
  admin: {
    group: 'Catálogo',
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
  fields: [
    {
      label: 'Caratula',
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
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
      // Los materiales existentes son libros
      defaultValue: 'libro',
      options: [
        { label: 'Libro', value: 'libro' },
        { label: 'Juego', value: 'juego' },
        { label: 'Programa técnico', value: 'programa' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Contenido',
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      label: 'Cantidad total',
      name: 'quantity',
      type: 'number',
      required: false,
    },
    {
      label: 'Reservas',
      type: 'join',
      on: 'item',
      name: 'reservations',
      collection: 'reservation',
    },
    buildTaxonomyRelationship({
      name: 'categories',
      label: 'Categorías',
      required: true,
      defaultValue: [],
      filterOptions: () => {
        return {
          'payload.types': { in: ['topic'] },
        }
      },
    }),
  ],
}
