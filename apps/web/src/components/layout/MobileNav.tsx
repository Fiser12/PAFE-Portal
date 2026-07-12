'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { useUser } from '@/lib/auth/useUser'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CMSLink } from '@/components/legacy/Link'
import { getNavItems, isNavItemActive } from './nav-items'

import type { Header as HeaderType } from '@/payload-types'

const linkClasses =
  'block rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'

export const MobileNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const [open, setOpen] = useState(false)
  const { user } = useUser()
  const pathname = usePathname()
  const items = getNavItems(user)
  const cmsItems = data?.navItems || []
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-4/5 flex-col gap-0 p-0 sm:max-w-xs">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="font-bubblegum text-2xl font-black text-primary">PAFE</SheetTitle>
          <SheetDescription className="sr-only">Menú de navegación</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 overflow-y-auto p-4">
          {items.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                onClick={close}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  linkClasses,
                  isNavItemActive(item, pathname) && 'bg-accent text-foreground',
                )}
                onClick={close}
              >
                {item.label}
              </Link>
            ),
          )}
          {cmsItems.map(({ link }, i) => (
            // CMSLink no expone onClick: cerramos el sheet cuando el click burbujea
            <div key={i} onClick={close}>
              <CMSLink {...link} appearance="link" className={linkClasses} />
            </div>
          ))}
        </nav>
        <div className="mt-auto border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!user ? (
            <Button asChild className="w-full">
              <Link href="/login" onClick={close}>
                Entrar
              </Link>
            </Button>
          ) : (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
