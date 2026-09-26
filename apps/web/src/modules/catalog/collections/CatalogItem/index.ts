import { equipoTecnicoAccess, gestionarCatalogoTecnicoAccess } from '@/core/technical-access'
import { hiddenUnlessCatalogo } from '@/core/permissions'
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
    // Durante el lanzamiento, la lectura se limita a los psicólogos y Administración
    create: gestionarCatalogoTecnicoAccess,
    delete: gestionarCatalogoTecnicoAccess,
    read: equipoTecnicoAccess,
    update: gestionarCatalogoTecnicoAccess,
  },
  admin: {
    group: 'Catálogo',
    hidden: hiddenUnlessCatalogo,
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
      localized: true,
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
      label: 'Contenido',
      name: 'content',
      type: 'richText',
      localized: true,
      required: false,
    },
    {
      label: 'Aportaciones de las familias',
      name: 'contributions',
      type: 'richText',
      localized: true,
      required: false,
      admin: {
        description:
          'Sugerencias de uso recogidas de las familias: perfiles, objetivos, para qué trabajar',
      },
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
    }),
  ],
}
