import { buildTaxonomyRelationship } from '@nexo-labs/payload-taxonomies'
import { CollectionConfig } from 'payload'

export const COLLECTION_SLUG_CATALOG_ITEM = 'catalog-item'

export const CatalogItem: CollectionConfig = {
  slug: COLLECTION_SLUG_CATALOG_ITEM,
  labels: {
    singular: 'Catalog Item',
    plural: 'Catalog Items',
  },
  admin: {
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
      collection: 'reservation'
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
