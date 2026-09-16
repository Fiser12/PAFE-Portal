import type { CollectionBeforeDeleteHook } from 'payload'
import { COLLECTION_SLUG_RESPUESTA } from '@/core/collections-slugs'

/**
 * Retirar una noticia se lleva lo que se respondió en ella. Sin esto no se
 * puede borrar: la respuesta apunta a su noticia y el campo es obligatorio.
 */
export const borrarSusRespuestas: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: COLLECTION_SLUG_RESPUESTA,
    where: { noticia: { equals: id } },
    overrideAccess: true,
    req,
  })
}
