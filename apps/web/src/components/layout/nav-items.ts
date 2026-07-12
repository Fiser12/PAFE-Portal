import type { User } from '@/payload-types'
import { isAdmin, isStaff } from '@/core/permissions'

export interface NavItem {
  label: string
  href: string
  external?: boolean
}

/**
 * Navegación principal del portal. Los items dependen del rol:
 * Casos solo para admin, Administración para staff (admin/profesional).
 */
export function getNavItems(user: User | null): NavItem[] {
  const items: NavItem[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Catálogo', href: '/catalog' },
  ]
  if (isAdmin(user)) {
    items.push({ label: 'Casos', href: '/cases' })
  }
  items.push({ label: 'Foro', href: 'https://foro.pafe-formakuntza.com/', external: true })
  if (isStaff(user)) {
    items.push({ label: 'Administración', href: '/admin' })
  }
  return items
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.external) return false
  if (item.href === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
