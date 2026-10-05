import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { getUserRoles } from '@/core/permissions'
import { normalizarCorreo } from '@/modules/invitaciones/domain/invitacion'

const ACEPTADA = 'invitacionAceptada'

const pendienteDe = async (req: PayloadRequest, email: string) =>
  (
    await req.payload.find({
      collection: 'admin-invitations',
      where: { email: { equals: normalizarCorreo(email) } },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
  ).docs[0]

/**
 * Quien entra con Google desde «Entrar» no trae el enlace de su invitación: se
 * la reconoce por el correo. Solo por la Local API, que es por donde crea
 * cuentas better-auth; por REST sería un atajo para quedarse con la invitación
 * de otra persona.
 */
export const rolDeSuInvitacion: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.payloadAPI !== 'local' || typeof data.email !== 'string') {
    return data
  }
  if (getUserRoles(data).length > 0) return data
  const invitacion = await pendienteDe(req, data.email)
  if (!invitacion) return data
  req.context[ACEPTADA] = invitacion.id
  return { ...data, role: [invitacion.role] }
}

export const cerrarSuInvitacion: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  const id = req.context[ACEPTADA]
  if (operation !== 'create' || (typeof id !== 'number' && typeof id !== 'string')) return doc
  delete req.context[ACEPTADA]
  await req.payload.delete({ collection: 'admin-invitations', id, req, overrideAccess: true })
  return doc
}
