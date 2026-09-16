import type { Payload } from 'payload'
import { GLOBAL_SLUG_PRESENTACION } from '../globals/PresentacionCatalogo'

/** El texto de la presentación, o null si alguien lo dejó vacío a propósito */
export const textoDePresentacion = async (payload: Payload) => {
  const global = await payload.findGlobal({
    slug: GLOBAL_SLUG_PRESENTACION,
    depth: 0,
    overrideAccess: true,
  })
  return global?.texto ?? null
}
