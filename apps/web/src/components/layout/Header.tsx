'use client'

import React from 'react'
import Link from 'next/link'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/legacy/Logo/LogoImage'
import { LogoTitle } from '@/components/legacy/Logo/LogoTitle'
import { HeaderNav } from './HeaderNav'
import { MobileNav } from './MobileNav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-10 w-auto" loading="eager" priority="high" />
          <LogoTitle className="text-2xl" />
        </Link>
        <HeaderNav data={data} />
        <MobileNav data={data} />
      </div>
    </header>
  )
}
