import type { Access, Payload, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'
import { isActiveUser, isAdmin, hasRole, ROLE_PROFESIONAL, administraCatalogo } from './permissions'
import { GRUPO_LANTALDE } from '@/modules/tablon/domain/areas'

export async function esEquipoTecnico(
  payload: Payload,
  user: User | null | undefined,
  req?: PayloadRequest,
): Promise<boolean> {
  if (!user || !isActiveUser(user)) return false
  if (isAdmin(user) || hasRole(user, ROLE_PROFESIONAL)) return true
  const ids = (user.groups ?? []).map((group) => (typeof group === 'object' ? group.id : group))
  if (!ids.length) return false
  const result = await payload.find({
    collection: 'groups',
    where: { and: [{ id: { in: ids } }, { name: { equals: GRUPO_LANTALDE } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return result.docs.length > 0
}

export const equipoTecnicoAccess: Access = ({ req }) => esEquipoTecnico(req.payload, req.user, req)

export const gestionarCatalogoTecnicoAccess: Access = async ({ req }) =>
  administraCatalogo(req.user) && (await esEquipoTecnico(req.payload, req.user, req))
