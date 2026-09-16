import type { CollectionAfterChangeHook } from 'payload'
import type { Noticia } from '@/payload-types'
import { estaPublicada } from '../../../domain/noticias'

export const SALTAR_AVISO = 'saltarAvisoDelTablon'

/**
 * Avisa a los suscritos al área cuando una noticia se publica, venga del panel,
 * de la API o de un servicio. Solo una vez: `notifiedAt` cierra la puerta.
 */
export const avisarAlPublicar: CollectionAfterChangeHook<Noticia> = async ({
  doc,
  req,
  context,
}) => {
  if (context?.[SALTAR_AVISO]) return doc
  if (doc.notifiedAt) return doc
  if (!estaPublicada({ publishedAt: doc.publishedAt, now: new Date() })) return doc

  const { avisarDeNoticia } = await import('../../../services')
  await avisarDeNoticia({ payload: req.payload, noticia: doc, req })
  return doc
}
