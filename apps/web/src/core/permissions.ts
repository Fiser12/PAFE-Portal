import type { Access, ClientUser, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

/**
 * Roles del sistema (campo `role` inyectado por payload-auth). Son
 * acumulables: una misma persona puede llevar el catálogo y el tablón.
 *
 * Un usuario recién registrado no tiene NINGÚN rol (role: []) y por tanto
 * ningún permiso, hasta que alguien se lo asigna a mano.
 * Los grupos viven en `groups`; `lantalde-teknikoa` da acceso al contenido
 * del equipo técnico a personas con un rol activo.
 */
/** Administra todo */
export const ROLE_ADMIN = 'admin'
/** Administra materiales, taxonomía y el día a día del préstamo */
export const ROLE_CATALOGO = 'admin-catalogo'
/** Administra las altas y el rol familia */
export const ROLE_USUARIOS = 'admin-users'
/** Administra el tablón de noticias */
export const ROLE_TABLON = 'admin-news'
/** Familias: leen el foro y consultan su área personal */
export const ROLE_FAMILIA = 'familia'
/** Psicólogos del equipo técnico; conserva la gestión de préstamos del rol profesional */
export const ROLE_PROFESIONAL = 'profesional'

export const ADMIN_AREA_ROLES = [ROLE_CATALOGO, ROLE_USUARIOS, ROLE_TABLON]

export const ALL_ROLES = [ROLE_ADMIN, ...ADMIN_AREA_ROLES, ROLE_FAMILIA, ROLE_PROFESIONAL]
export const ADMIN_PANEL_ROLES = [ROLE_ADMIN]
/**
 * Lo único que puede repartir quien no es admin. Los roles de gestión se
 * quedan fuera a propósito: si quien da de altas pudiera concederlos, el
 * reparto se desharía solo.
 */
export const STAFF_MANAGEABLE_ROLES = [ROLE_FAMILIA]

/**
 * Lo que se lee en el panel. El valor guardado dice «admin» para que el código
 * distinga administrar de consumir; la etiqueta no, porque de administrador
 * solo figura quien lo es de todo.
 */
export const ROLE_LABELS: Record<string, string> = {
  [ROLE_ADMIN]: 'Administración',
  [ROLE_CATALOGO]: 'Catálogo y préstamos',
  [ROLE_USUARIOS]: 'Altas de personas',
  [ROLE_TABLON]: 'Tablón de noticias',
  [ROLE_FAMILIA]: 'Familia',
  [ROLE_PROFESIONAL]: 'Psicólogo/a (equipo técnico)',
}

export type RoleSlug = (typeof ALL_ROLES)[number]

/** El campo role es un select hasMany (array), pero toleramos string por robustez */
type MaybeUser =
  (Partial<Pick<User, 'id' | 'email'>> & { role?: unknown }) | ClientUser | null | undefined

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

export const isAdmin = (user: MaybeUser): boolean => hasRole(user, ROLE_ADMIN) || isSuperAdmin(user)

/** Catálogo, materiales, taxonomía y el préstamo del día a día */
export const administraCatalogo = (user: MaybeUser): boolean =>
  isAdmin(user) || hasRole(user, ROLE_CATALOGO, ROLE_PROFESIONAL)

/** Dar de alta personas y asignarles el rol familia */
export const administraUsuarios = (user: MaybeUser): boolean =>
  isAdmin(user) || hasRole(user, ROLE_USUARIOS)

/** Publicar y editar en el tablón de noticias */
export const administraTablon = (user: MaybeUser): boolean =>
  isAdmin(user) || hasRole(user, ROLE_TABLON)

/**
 * Equipo = cualquiera con un rol de gestión. Sirve para entrar al panel y para
 * lo transversal; lo que se puede tocar dentro lo decide cada área.
 */
export const isStaff = (user: MaybeUser): boolean =>
  isAdmin(user) || hasRole(user, ...ADMIN_AREA_ROLES, ROLE_PROFESIONAL)

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

export const catalogoAccess: Access = ({ req }) => administraCatalogo(req.user)

export const usuariosAccess: Access = ({ req }) => administraUsuarios(req.user)

export const tablonAccess: Access = ({ req }) => administraTablon(req.user)

export const isActiveUserAccess: Access = ({ req }) => isActiveUser(req.user)

/** Quien da de altas ve a todo el mundo; el resto solo su propio documento */
export const usuariosOrSelfAccess: Access = ({ req }) => {
  if (!req.user) return false
  if (administraUsuarios(req.user)) return true
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
    if (administraCatalogo(req.user)) return true
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

export const hiddenUnlessCatalogo: HiddenFieldProps = ({ user }) =>
  !administraCatalogo(user as MaybeUser)

export const hiddenUnlessUsuarios: HiddenFieldProps = ({ user }) =>
  !administraUsuarios(user as MaybeUser)

export const hiddenUnlessTablon: HiddenFieldProps = ({ user }) =>
  !administraTablon(user as MaybeUser)
