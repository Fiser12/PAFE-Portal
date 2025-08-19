import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/legacy/AdminBar'
import { Footer } from '@/payload/admin_components/Footer/Component'
import { Header } from '@/payload/admin_components/Header/Component'
import { MobileBottomNav } from '@/components/ui/MobileBottomNav'
import { Providers } from '@/components/providers'
import { InitTheme } from '@/components/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { PayloadSessionProvider } from "payload-authjs/client";
import { getPayloadSession } from "payload-authjs";

import '../globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <PayloadSessionProvider session={await getPayloadSession()}>

            <Header />
            <main style={{ paddingBottom: '64px' }} className="md:pb-0">
              {children}
            </main>
            <Footer />
            <MobileBottomNav />
          </PayloadSessionProvider>

        </Providers>
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
