import type { Access, ClientUser, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

/**
 * Roles fijos del sistema (campo `role` inyectado por payload-auth).
 * Un usuario recién registrado no tiene NINGÚN rol (role: []) y por tanto
 * ningún permiso, hasta que el staff le asigna uno a mano.
 * Los "grupos" dinámicos viven en la colección `groups` y NO otorgan permisos:
 * la seguridad se decide únicamente con estos roles.
 */
export const ROLE_ADMIN = 'admin'
export const ROLE_PROFESIONAL = 'profesional'
export const ROLE_FAMILIA = 'familia'

export const ALL_ROLES = [ROLE_ADMIN, ROLE_PROFESIONAL, ROLE_FAMILIA]
export const ADMIN_PANEL_ROLES = [ROLE_ADMIN, ROLE_PROFESIONAL]
/** Roles que un profesional puede asignar/quitar (no puede tocar admins ni crear profesionales) */
export const STAFF_MANAGEABLE_ROLES = [ROLE_FAMILIA]

export type RoleSlug = (typeof ALL_ROLES)[number]

/** El campo role es un select hasMany (array), pero toleramos string por robustez */
type MaybeUser =
  | (Partial<Pick<User, 'id' | 'email'>> & { role?: unknown })
  | ClientUser
  | null
  | undefined

export const getUserRoles = (user: MaybeUser): string[] => {
  const role = (user as { role?: unknown } | null | undefined)?.role
  if (Array.isArray(role)) return role.filter((r): r is string => typeof r === 'string')
  if (typeof role === 'string') return [role]
  return []
}

export const isSuperAdminEnabled = () => process.env.ENABLED_SUPER_ADMIN === 'true'

export const isSuperAdmin = (user: MaybeUser): boolean => {
  if (!isSuperAdminEnabled()) return false
  return Boolean(user?.email && process.env.SUPER_ADMIN_EMAIL === user.email)
}

export const hasRole = (user: MaybeUser, ...slugs: string[]): boolean => {
  const roles = getUserRoles(user)
  return slugs.some((slug) => roles.includes(slug))
}

export const isAdmin = (user: MaybeUser): boolean =>
  hasRole(user, ROLE_ADMIN) || isSuperAdmin(user)

/** Staff = admin o profesional: gestionan materiales, solicitudes, casos y usuarios */
export const isStaff = (user: MaybeUser): boolean =>
  isAdmin(user) || hasRole(user, ROLE_PROFESIONAL)

/**
 * Usuario activo = con algún rol asignado (familia o staff).
 * Un usuario recién registrado con Google no tiene rol y NO es activo:
 * no puede reservar ni ver contenido interno hasta que el staff le asigne uno.
 */
export const isActiveUser = (user: MaybeUser): boolean =>
  isStaff(user) || hasRole(user, ROLE_FAMILIA)

// ---------------------------------------------------------------------------
// Access functions (CRUD real, protegen REST/GraphQL)
// ---------------------------------------------------------------------------

export const isAdminAccess: Access = ({ req }) => isAdmin(req.user)

export const isStaffAccess: Access = ({ req }) => isStaff(req.user)

export const isActiveUserAccess: Access = ({ req }) => isActiveUser(req.user)

/** Staff ve todo; el resto solo su propio documento de usuario */
export const staffOrSelfAccess: Access = ({ req }) => {
  if (!req.user) return false
  if (isStaff(req.user)) return true
  return { id: { equals: req.user.id } }
}

export const adminOrSelfAccess: Access = ({ req, id }) => {
  if (!req.user) return false
  if (isAdmin(req.user)) return true
  return id !== undefined && String(id) === String(req.user.id)
}

/** Staff ve todo; un usuario activo solo los documentos cuyo campo owner apunta a él */
export const staffOrOwnerAccess =
  (ownerField = 'user'): Access =>
  ({ req }) => {
    if (!req.user) return false
    if (isStaff(req.user)) return true
    if (!isActiveUser(req.user)) return false
    return { [ownerField]: { equals: req.user.id } }
  }

const extractIDs = (rel: unknown): (number | string)[] => {
  if (!Array.isArray(rel)) return []
  return rel
    .map((r) => (typeof r === 'object' && r !== null ? (r as { id?: number | string }).id : r))
    .filter((v): v is number | string => typeof v === 'number' || typeof v === 'string')
}

/** IDs de los casos asignados al usuario (relación users.assignedCases) */
export const getUserCaseIDs = (user: PayloadRequest['user']): (number | string)[] =>
  extractIDs((user as User | null)?.assignedCases)

/** Staff ve todos los casos; una familia solo sus casos asignados */
export const staffOrOwnCasesAccess: Access = ({ req }) => {
  if (!req.user) return false
  if (isStaff(req.user)) return true
  if (!isActiveUser(req.user)) return false
  const caseIDs = getUserCaseIDs(req.user)
  if (caseIDs.length === 0) return false
  return { id: { in: caseIDs } }
}

/** Staff ve todas las tareas; una familia solo las de sus casos asignados */
export const staffOrOwnCaseTasksAccess: Access = ({ req }) => {
  if (!req.user) return false
  if (isStaff(req.user)) return true
  if (!isActiveUser(req.user)) return false
  const caseIDs = getUserCaseIDs(req.user)
  if (caseIDs.length === 0) return false
  return { case: { in: caseIDs } }
}

// ---------------------------------------------------------------------------
// Visibilidad en el panel de admin (solo UI; la seguridad real es el access)
// ---------------------------------------------------------------------------

export type HiddenFieldProps = (args: { user: PayloadRequest['user'] | ClientUser }) => boolean

export const hiddenUnlessAdmin: HiddenFieldProps = ({ user }) => !isAdmin(user as MaybeUser)

export const hiddenUnlessStaff: HiddenFieldProps = ({ user }) => !isStaff(user as MaybeUser)
