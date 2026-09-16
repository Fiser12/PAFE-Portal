import { HeaderClient } from '@/components/layout/Header'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getIdioma } from '@/utilities/getIdioma'
import React from 'react'

import type { Header } from '@/payload-types'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const idioma = await getIdioma()

  return <HeaderClient data={headerData} idioma={idioma} />
}