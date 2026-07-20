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
      // Opcional: las carátulas reales llegan después desde el admin y el
      // seed de producción debe poder crear ítems sin portada
      required: false,
    },
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      label: 'Autor',
      name: 'author',
      type: 'text',
      required: false,
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
      label: 'Idioma',
      name: 'language',
      type: 'select',
      required: false,
      options: [
        { label: 'Castellano', value: 'castellano' },
        { label: 'Euskera', value: 'euskera' },
        { label: 'Bilingüe (eus/cas)', value: 'bilingue' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      label: 'Días de préstamo',
      name: 'loanDays',
      type: 'number',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Duración del préstamo: libros 30 días, juegos 20, programas 15–30',
      },
    },
    {
      label: 'Contenido',
      name: 'content',
      type: 'richText',
      required: false,
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
      defaultValue: []
    }),
  ],
}
