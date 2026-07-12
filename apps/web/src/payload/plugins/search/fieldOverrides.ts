import { Field } from 'payload'
import { COLLECTION_SLUG_MEDIA } from '@/core/collections-slugs'

// Campos que copiamos al índice de búsqueda para poder filtrar y pintar las
// tarjetas del catálogo sin resolver el documento original.
export const searchFields: Field[] = [
  {
    // Colección de origen: 'catalog-item' | 'files' | 'external-resources'
    name: 'collectionType',
    type: 'text',
    index: true,
    admin: { readOnly: true },
  },
  {
    // Tipo interno del material (libro/juego/programa, video/web_link/…)
    name: 'itemType',
    type: 'text',
    index: true,
    admin: { readOnly: true },
  },
  {
    name: 'cover',
    type: 'upload',
    relationTo: COLLECTION_SLUG_MEDIA,
    admin: { readOnly: true },
  },
  {
    label: 'Categorías',
    name: 'categories',
    type: 'array',
    admin: { readOnly: true },
    fields: [
      { name: 'id', type: 'text' },
      { name: 'title', type: 'text' },
    ],
  },
]
