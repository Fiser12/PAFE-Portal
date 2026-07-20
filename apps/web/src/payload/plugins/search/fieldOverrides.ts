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
    // URL de destino de la tarjeta: el enlace externo (external-resources) o el
    // fichero subido (files). El campo `doc` del plugin tiene maxDepth 0, así
    // que sin esta copia la tarjeta no puede montar el botón Ver/Descargar.
    name: 'url',
    type: 'text',
    admin: { readOnly: true },
  },
  {
    label: 'Categorías',
    name: 'categories',
    type: 'array',
    admin: { readOnly: true },
    fields: [
      // OJO: no usar `id` aquí. Payload convierte un campo `id` del array en la
      // PK (global) de la tabla search_categories, y como las categorías se
      // comparten entre items, el mismo id colisiona y aborta el sync.
      { name: 'categoryId', type: 'text' },
      { name: 'title', type: 'text' },
    ],
  },
]
