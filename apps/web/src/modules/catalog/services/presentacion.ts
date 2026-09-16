import type { Payload } from 'payload'
import type { CodigoIdioma } from '@/core/localization'
import { GLOBAL_SLUG_PRESENTACION } from '../globals/PresentacionCatalogo'

/** El texto de la presentación, o null si alguien lo dejó vacío a propósito */
export const textoDePresentacion = async (payload: Payload, locale?: CodigoIdioma) => {
  const global = await payload.findGlobal({
    slug: GLOBAL_SLUG_PRESENTACION,
    depth: 0,
    locale,
    overrideAccess: true,
  })
  return global?.texto ?? null
}
