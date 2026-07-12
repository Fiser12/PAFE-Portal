import { Forbidden, type CollectionBeforeChangeHook } from 'payload'
import { ROLE_ADMIN, STAFF_MANAGEABLE_ROLES, isAdmin, isStaff } from '@/core/permissions'

const normalizeRoles = (role: unknown): string[] => {
  if (Array.isArray(role)) return role.filter((r): r is string => typeof r === 'string')
  if (typeof role === 'string') return [role]
  return []
}

const sameRoles = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

/**
 * Impide la escalada de privilegios vía REST/GraphQL:
 * - Nadie que no sea admin puede cambiar roles (ni los suyos).
 * - Un profesional solo asigna/quita el rol familia (o deja al usuario sin
 *   rol): no puede tocar admins ni promover a profesional o admin.
 * - Un usuario normal no puede reasignarse grupos ni casos.
 *
 * La Local API (better-auth, seeds, plumbing interno) queda exenta, igual que
 * en ZetesisPortal: los flujos internos confiables la usan.
 */
export const preventPrivilegeEscalation: CollectionBeforeChangeHook = async ({
  req,
  data,
  originalDoc,
  operation,
}) => {
  if (req.payloadAPI === 'local') return data
  if (isAdmin(req.user)) return data

  const incomingRoles = data?.role === undefined ? undefined : normalizeRoles(data.role)
  const originalRoles = normalizeRoles(originalDoc?.role)

  if (isStaff(req.user)) {
    // Un profesional no puede modificar a un admin
    if (operation === 'update' && originalRoles.includes(ROLE_ADMIN)) {
      throw new Forbidden(req.t)
    }
    // Solo puede asignar roles gestionables (familia/pendiente)
    if (incomingRoles !== undefined && !sameRoles(incomingRoles, originalRoles)) {
      const allAllowed = incomingRoles.every((r) => STAFF_MANAGEABLE_ROLES.includes(r))
      if (!allAllowed) throw new Forbidden(req.t)
    }
    return data
  }

  // Usuario no-staff (solo puede llegar aquí editándose a sí mismo):
  // cualquier cambio de rol está prohibido; grupos y casos se ignoran.
  if (incomingRoles !== undefined && !sameRoles(incomingRoles, originalRoles)) {
    throw new Forbidden(req.t)
  }
  if (data) {
    delete data.groups
    delete data.assignedCases
    delete data.reservations
  }
  return data
}
