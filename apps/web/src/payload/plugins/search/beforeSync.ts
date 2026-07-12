import { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

const extractId = (value: unknown): string | number | null => {
  if (value == null) return null
  if (typeof value === 'object') return (value as { id?: string | number }).id ?? null
  return value as string | number
}

/**
 * Copia al índice de búsqueda los campos que el catálogo necesita para
 * filtrar (categorías, tipo) y pintar las tarjetas (título, portada).
 * Indexa catalog-item, files y external-resources.
 */
export const beforeSyncWithSearch: BeforeSync = async ({ originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  const { title, type, cover, categories } = originalDoc as {
    title?: string
    type?: string
    cover?: unknown
    categories?: Array<{ id?: string | number; name?: string } | number>
  }

  const mappedCategories = Array.isArray(categories)
    ? categories
        .map((category) => {
          if (typeof category === 'object' && category !== null) {
            return { categoryId: String(category.id ?? ''), title: category.name ?? '' }
          }
          return { categoryId: String(category), title: '' }
        })
        .filter((c) => c.categoryId)
    : []

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    title: title ?? searchDoc.title,
    collectionType: collection,
    itemType: type ?? null,
    cover: extractId(cover),
    categories: mappedCategories,
  }

  return modifiedDoc
}
