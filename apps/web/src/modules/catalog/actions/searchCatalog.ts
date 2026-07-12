'use server'

import type { Where } from 'payload'
import { getSessionUser } from '@/utilities/getSessionUser'

export interface SearchCatalogParams {
  query?: string
  categoryIds?: (string | number)[]
  collectionType?: string
  itemType?: string
}

/**
 * Busca en el índice global del catálogo (colección search), que agrega
 * materiales reservables, descargables y recursos externos.
 * La lectura del índice exige rol, así que se usa el usuario de sesión.
 */
export async function searchCatalog({
  query,
  categoryIds,
  collectionType,
  itemType,
}: SearchCatalogParams = {}) {
  const { payload, user } = await getSessionUser()

  const and: Where[] = []
  if (query?.trim()) and.push({ title: { contains: query.trim() } })
  if (categoryIds && categoryIds.length > 0) {
    and.push({ 'categories.id': { in: categoryIds.map(String) } })
  }
  if (collectionType) and.push({ collectionType: { equals: collectionType } })
  if (itemType) and.push({ itemType: { equals: itemType } })

  const results = await payload.find({
    collection: 'search',
    where: and.length > 0 ? { and } : {},
    depth: 1,
    limit: 100,
    sort: 'title',
    overrideAccess: false,
    user,
  })

  return results.docs
}
