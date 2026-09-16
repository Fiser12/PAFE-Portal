import type { Access } from 'payload'
import { isStaff } from '@/core/permissions'

/** Quien la escribió puede corregirla o retirarla; el staff, la de cualquiera */
export const autoriaOStaffAccess: Access = ({ req }) => {
  if (!req.user) return false
  if (isStaff(req.user)) return true
  return { author: { equals: req.user.id } }
}
