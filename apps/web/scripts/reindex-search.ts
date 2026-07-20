/**
 * Fuerza la re-sincronización del índice de búsqueda (colección `search`)
 * re-guardando los documentos de las colecciones indexadas. Útil tras cambiar
 * `beforeSync`/`fieldOverrides` (p. ej. al añadir el campo `url`).
 *
 * Uso: cd apps/web && pnpm payload run scripts/reindex-search.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const COLLECTIONS = ['external-resources', 'files', 'catalog-item'] as const

for (const collection of COLLECTIONS) {
  const docs = await payload.find({
    collection: collection as never,
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  let ok = 0
  for (const doc of docs.docs as Array<{ id: number | string }>) {
    try {
      // Update sin cambios: dispara los hooks de sync del plugin de búsqueda
      await payload.update({
        collection: collection as never,
        id: doc.id as never,
        data: {} as never,
        overrideAccess: true,
      })
      ok++
    } catch (err) {
      payload.logger.warn(`[reindex] ${collection}/${doc.id}: ${(err as Error).message}`)
    }
  }
  payload.logger.info(`[reindex] ${collection}: ${ok}/${docs.totalDocs}`)
}
process.exit(0)
