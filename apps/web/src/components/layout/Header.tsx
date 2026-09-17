'use client'

import React from 'react'
import Link from 'next/link'

import type { Header } from '@/payload-types'
import type { CodigoIdioma } from '@/core/localization'

import { Logo } from '@/components/legacy/Logo/LogoImage'
import { LogoTitle } from '@/components/legacy/Logo/LogoTitle'
import { HeaderNav } from './HeaderNav'
import { MobileNav } from './MobileNav'

interface HeaderClientProps {
  data: Header
  idioma: CodigoIdioma
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, idioma }) => {
  return (
    <header className="sticky top-0 z-40 w-full pt-3">
      <div className="container">
        <div className="flex h-14 items-center justify-between gap-4 rounded-xl border bg-background/80 px-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/65">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-9 w-auto" loading="eager" priority="high" />
            <LogoTitle className="text-2xl" />
          </Link>
          <HeaderNav data={data} idioma={idioma} />
          <MobileNav data={data} idioma={idioma} />
        </div>
      </div>
    </header>
  )
}
