import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import React from 'react'

import { AdminBar } from '@/components/legacy/AdminBar'
import { IdiomaProvider } from '@/components/IdiomaProvider'
import { Footer } from '@/payload/admin_components/Footer/Component'
import { Header } from '@/payload/admin_components/Header/Component'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { getIdioma } from '@/utilities/getIdioma'

import '../globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const idioma = await getIdioma()

  return (
    <html
      className={cn(inter.variable, jakarta.variable, GeistMono.variable)}
      lang={idioma}
      suppressHydrationWarning
    >
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <IdiomaProvider idioma={idioma}>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <Header />
          <main className="bg-app-surface flex-1">{children}</main>
          <Footer />
        </IdiomaProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
