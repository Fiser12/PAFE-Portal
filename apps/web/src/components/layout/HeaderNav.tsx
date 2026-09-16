'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/ui'
import { useUser } from '@/lib/auth/useUser'
import { Button } from '@/components/ui/button'
import { CMSLink } from '@/components/legacy/Link'
import { getNavItems, isNavItemActive } from './nav-items'
import { NotificationsBell } from '@/modules/catalog/ui/NotificationsBell'
import { SelectorIdioma } from './SelectorIdioma'

import type { Header as HeaderType } from '@/payload-types'
import type { CodigoIdioma } from '@/core/localization'
import { useTextos } from '@/components/IdiomaProvider'

const linkClasses =
  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'

export const HeaderNav: React.FC<{ data: HeaderType; idioma: CodigoIdioma }> = ({
  data,
  idioma,
}) => {
  const t = useTextos()
  const { user } = useUser()
  const pathname = usePathname()
  const items = getNavItems(user, t)
  const cmsItems = data?.navItems || []

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item) =>
        item.external ? (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(linkClasses, isNavItemActive(item, pathname) && 'bg-accent text-foreground')}
          >
            {item.label}
          </Link>
        ),
      )}
      {cmsItems.map(({ link }, i) => (
        <CMSLink key={i} {...link} appearance="link" className={linkClasses} />
      ))}
      <SelectorIdioma idioma={idioma} />
      {user ? (
        <NotificationsBell />
      ) : (
        <Button asChild size="sm" className="ml-2">
          <Link href="/login">{t.entrar}</Link>
        </Button>
      )}
    </nav>
  )
}
