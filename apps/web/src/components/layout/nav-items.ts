import type { User } from '@/payload-types'
import { isActiveUser, isStaff } from '@/core/permissions'

export interface NavItem {
  label: string
  href: string
  external?: boolean
  /** Sirve fuera del router de Next (la wiki es estática): enlace normal, misma pestaña */
  plainLink?: boolean
}

/**
 * Navegación principal del portal. Los items dependen del rol.
 *
 * Casos no sale: la sección no está en uso. Quien la necesite llega por el
 * panel o por su dirección.
 */
export function getNavItems(user: User | null): NavItem[] {
  const items: NavItem[] = [{ label: 'Inicio', href: '/' }]
  // El catálogo es material interno: solo se ofrece a quien ya tiene rol
  if (isActiveUser(user)) items.push({ label: 'Catálogo', href: '/catalog' })
  items.push({ label: 'Foro', href: 'https://foro.pafe-formakuntza.com/', external: true })
  if (user) {
    items.push({ label: 'Wiki', href: '/wiki', plainLink: true })
    // Moodle conserva su propio inicio de sesión: se abre aparte
    items.push({
      label: 'Moodle',
      href: 'https://moodle.pafe-formakuntza.com/',
      external: true,
    })
  }
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
