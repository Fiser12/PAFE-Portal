import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/legacy/Link'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="container flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-col gap-4 md:flex-row">
          {navItems.map(({ link }, i) => {
            return (
              <CMSLink
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                key={i}
                {...link}
              />
            )
          })}
        </nav>
        <p className="text-xs text-muted-foreground">PAFE</p>
      </div>
    </footer>
  )
}
