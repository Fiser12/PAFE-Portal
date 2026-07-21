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
  for (const group of categoryGroups ?? []) {
    if (group.length > 0) {
      and.push({ 'categories.categoryId': { in: group.map(String) } })
    }
  }
  if (collectionType) and.push({ collectionType: { equals: collectionType } })
  if (itemType) and.push({ itemType: { equals: itemType } })

  const results = await payload.find({
    collection: 'search',
    where: and.length > 0 ? { and } : {},
    depth: 1,
    page,
    limit,
    sort: 'title',
    overrideAccess: false,
    user,
  })

  return {
    docs: results.docs,
    totalDocs: results.totalDocs,
    page: results.page ?? page,
    hasNextPage: results.hasNextPage,
  }
}
