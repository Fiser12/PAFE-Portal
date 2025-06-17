import { Taxonomy, User } from '@/payload-types'
import { ClientUser, PayloadRequest } from 'payload'
import "@nexo-labs/hegel";

const admin = 'admin'
const gestor = 'gestor'
const familia = 'family'

export const permissions = {
  admin,
  gestor,
  familia,
}

type CommonAccess = ({ req }: { req: PayloadRequest }) => boolean | Promise<boolean>

type RoleSlug = (typeof permissions)[keyof typeof permissions]

export const isSuperAdminEnabled = () => process.env.ENABLED_SUPER_ADMIN === 'true'

export const isSuperAdmin = ({ user }: { user?: User | null }): boolean => {
  const _isSuperAdminEnabled =
    isSuperAdminEnabled() && process.env.SUPER_ADMIN_EMAIL === user?.email
  console.warn(`isSuperAdminEnabled: ${_isSuperAdminEnabled}`)
  return _isSuperAdminEnabled
}

export const isAdmin = ({ user }: { user?: User | null }): boolean => {
  const isAdmin = checkRole({ roleSlug: admin, user }) || isSuperAdmin({ user })
  console.warn(`isAdmin: ${isAdmin}`)
  return isAdmin
}

export type IsAdminHiddenProps =
  | ((args: { user: PayloadRequest['user'] | ClientUser }) => boolean)
  | boolean

export const isAdminHidden: IsAdminHiddenProps = ({ user }) => {
  const isAdminEnabled = isAdmin({ user: user as unknown as User })
  console.warn(`isAdminEnabled: ${isAdminEnabled}`)
  return !isAdminEnabled
}

export const isAdminAccess: CommonAccess = ({ req }): boolean => {
  return isAdmin({ user: req.user })
}

interface CheckRoleProps {
  roleSlug: RoleSlug
  user?: User | null
}

export const checkRoleAccess: (props: Omit<CheckRoleProps, 'user'>) => CommonAccess =
  ({ roleSlug }) =>
  ({ req }): boolean => {
    return checkRole({ roleSlug, user: req.user })
  }

export const checkRole = ({ roleSlug, user }: CheckRoleProps): boolean => {
  return user?.roles?.cast<Taxonomy>().some((role) => role.slug === roleSlug) ?? false
}

interface CheckRolesProps {
  rolesSlug: RoleSlug[]
  user?: User | null
}

export const checkRolesAccess: (props: { rolesSlug: RoleSlug[] }) => CommonAccess =
  ({ rolesSlug }) =>
  ({ req }): boolean => {
    return checkRoles({ rolesSlug, user: req.user })
  }

export const checkRoles = ({ rolesSlug, user }: CheckRolesProps): boolean => {
  return user?.roles?.cast<Taxonomy>().some((role) => rolesSlug.includes(role.slug ?? '')) ?? false
}
