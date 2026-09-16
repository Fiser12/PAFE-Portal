import type { User } from '@/payload-types'
import { isActiveUser, isStaff } from '@/core/permissions'
import type { Textos } from '@/core/textos'

export interface NavItem {
  label: string
  href: string
  /** Se abre en su propia pestaña con un enlace normal, fuera del router de Next */
  external?: boolean
}

/**
 * Navegación principal del portal. Los items dependen del rol.
 *
 * Casos no sale: la sección no está en uso. Quien la necesite llega por el
 * panel o por su dirección.
 */
export function getNavItems(user: User | null, t: Textos): NavItem[] {
  const items: NavItem[] = [{ label: t.navInicio, href: '/' }]
  // El catálogo es material interno: solo se ofrece a quien ya tiene rol
  if (isActiveUser(user)) items.push({ label: t.catalogo, href: '/catalog' })
  items.push({ label: t.navForo, href: 'https://foro.pafe-formakuntza.com/', external: true })
  if (user) {
    // La wiki es un sitio aparte servido fuera del router: se abre en otra pestaña
    items.push({ label: t.navWiki, href: '/wiki', external: true })
    // Moodle conserva su propio inicio de sesión: se abre aparte
    items.push({
      label: t.navMoodle,
      href: 'https://moodle.pafe-formakuntza.com/',
      external: true,
    })
  }
  if (isStaff(user)) {
    items.push({ label: t.navAdministracion, href: '/admin' })
  }
  return items
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.external) return false
  if (item.href === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
