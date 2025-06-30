import { checkRoleHidden } from '@/core/permissions'
import { buildTaxonomyRelationship } from '@nexo-labs/payload-taxonomies'
import { CollectionConfig } from 'payload'
import { authenticated } from '@/payload/access/authenticated'
import { anyone } from '@/payload/access/anyone'

export const COLLECTION_SLUG_CATALOG_ITEM = 'catalog-item'

export const CatalogItem: CollectionConfig = {
  slug: COLLECTION_SLUG_CATALOG_ITEM,
  labels: {
    singular: 'Item del catálogo',
    plural: 'Items del catálogo',
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Catálogo',
    hidden: checkRoleHidden('catalog-admin'),
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
      required: false,
    },
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
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
      required: false,
      defaultValue: [],
      filterOptions: () => {
        return {
          'payload.types': { in: ['topic'] },
        }
      },
    }),
  ],
}
