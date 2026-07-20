'use server'

import type { Where } from 'payload'
import { getSessionUser } from '@/utilities/getSessionUser'

export interface SearchCatalogParams {
  query?: string
  /**
   * Filtro facetado: cada grupo se combina con AND (temática ∧ edad ∧ …)
   * y dentro de un grupo los ids se combinan con OR (`in`).
   */
  categoryGroups?: (string | number)[][]
  collectionType?: string
  itemType?: string
  /** Página 1-based del scroll infinito */
  page?: number
  /** Tamaño de página */
  limit?: number
}

export interface SearchCatalogResult {
  docs: unknown[]
  totalDocs: number
  page: number
  hasNextPage: boolean
}

/**
 * Busca en el índice global del catálogo (colección search), que agrega
 * materiales reservables, descargables y recursos externos.
 * La lectura del índice exige rol, así que se usa el usuario de sesión.
 */
export async function searchCatalog({
  query,
  categoryGroups,
  collectionType,
  itemType,
  page = 1,
  limit = 24,
}: SearchCatalogParams = {}): Promise<SearchCatalogResult> {
  const { payload, user } = await getSessionUser()

  const and: Where[] = []
  if (query?.trim()) and.push({ title: { contains: query.trim() } })
  if (collectionType) and.push({ collectionType: { equals: collectionType } })
  if (itemType) and.push({ itemType: { equals: itemType } })

  const results = await payload.find({
    collection: 'search',
    where: and.length > 0 ? { and } : {},
    depth: 1,
    // El catálogo completo son unos cientos de docs: se trae entero y las
    // facetas se aplican abajo. OJO: dos cláusulas AND sobre
    // `categories.categoryId` en el mismo find NO funcionan (Payload las
    // aplica sobre el mismo join del array y no casan nunca).
    limit: 500,
    sort: 'title',
    overrideAccess: false,
    user,
  })

  // AND entre grupos (facetas); OR dentro de cada grupo
  const groups = (categoryGroups ?? [])
    .filter((g) => g.length > 0)
    .map((g) => g.map(String))
  const filtered =
    groups.length === 0
      ? results.docs
      : results.docs.filter((doc) => {
          const cats = (doc as { categories?: Array<{ categoryId?: string | null }> | null })
            .categories
          const ids = (cats ?? []).map((c) => c.categoryId).filter(Boolean) as string[]
          return groups.every((group) => group.some((id) => ids.includes(id)))
        })

  // Paginación sobre el conjunto ya filtrado (el post-filtro de facetas
  // rompería el tamaño de página si se paginara en la consulta)
  const start = (page - 1) * limit
  return {
    docs: filtered.slice(start, start + limit),
    totalDocs: filtered.length,
    page,
    hasNextPage: start + limit < filtered.length,
  }
}
