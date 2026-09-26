import type { User } from '@/payload-types'
import { isActiveUser, isAdmin } from '@/core/permissions'
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
export function getNavItems(user: User | null, t: Textos, tecnico = false): NavItem[] {
  const items: NavItem[] = [{ label: t.navInicio, href: '/' }]
  if (isActiveUser(user)) items.push({ label: t.navForo, href: '/foro' })
  if (tecnico) items.push({ label: t.catalogo, href: '/catalog' })
  if (user) {
    items.push({ label: t.navMoodle, href: 'https://moodle.pafe-formakuntza.com/', external: true })
  }
  if (tecnico) items.push({ label: t.navWiki, href: '/wiki', external: true })
  if (isActiveUser(user)) items.push({ label: t.navAreaPersonal, href: '/area-personal' })
  if (isAdmin(user)) items.push({ label: t.navAdministracion, href: '/admin' })
  return items
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.external) return false
  if (item.href === '/foro' && pathname.startsWith('/noticias/')) return true
  if (item.href === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
