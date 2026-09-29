import { Forbidden, type CollectionBeforeChangeHook } from 'payload'
import {
  ROLE_ADMIN,
  ROLE_IMPERSONAR,
  STAFF_MANAGEABLE_ROLES,
  administraUsuarios,
  isAdmin,
  isSuperAdmin,
} from '@/core/permissions'

const normalizeRoles = (role: unknown): string[] => {
  if (Array.isArray(role)) return role.filter((r): r is string => typeof r === 'string')
  if (typeof role === 'string') return [role]
  return []
}

const sameRoles = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

/** Con el correo se toma la cuenta: basta pedir el cambio de contraseña */
const cambiaElCorreo = (data: { email?: unknown } | undefined, original: { email?: unknown } | undefined) =>
  data?.email !== undefined && data.email !== original?.email

const cambiaImpersonar = (entrantes: string[] | undefined, originales: string[]) =>
  entrantes !== undefined &&
  entrantes.includes(ROLE_IMPERSONAR) !== originales.includes(ROLE_IMPERSONAR)

/**
 * Impide la escalada de privilegios vía REST/GraphQL:
 * - El rol de impersonar solo lo da y lo quita el superadmin, ni siquiera un admin;
 *   a quien lo tiene solo el superadmin le cambia el correo, y quien da de altas
 *   no le toca nada.
 * - Nadie que no sea admin puede cambiar roles (ni los suyos).
 * - Quien da de altas solo asigna/quita el rol familia (o deja al usuario sin
 *   rol): no puede tocar admins ni repartir roles de administración. Si
 *   pudiera, el reparto por áreas se desharía solo.
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

  const incomingRoles = data?.role === undefined ? undefined : normalizeRoles(data.role)
  const originalRoles = normalizeRoles(originalDoc?.role)

  if (cambiaImpersonar(incomingRoles, originalRoles) && !isSuperAdmin(req.user)) {
    throw new Forbidden(req.t)
  }
  if (
    operation === 'update' &&
    originalRoles.includes(ROLE_IMPERSONAR) &&
    String(req.user?.id) !== String(originalDoc?.id) &&
    !isSuperAdmin(req.user) &&
    (!isAdmin(req.user) || cambiaElCorreo(data, originalDoc))
  ) {
    throw new Forbidden(req.t)
  }
  if (isAdmin(req.user)) return data

  if (administraUsuarios(req.user)) {
    // Quien da de altas no puede modificar a un admin
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
