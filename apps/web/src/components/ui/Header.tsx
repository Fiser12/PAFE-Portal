'use client'
import { useHeaderTheme } from '@/components/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Container,
} from '@mui/material'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/legacy/Logo/LogoImage'
import { LogoTitle } from '@/components/legacy/Logo/LogoTitle'
import { HeaderNav } from './HeaderNav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <AppBar 
      component="header"
      position="relative"
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        zIndex: 20,
      }}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <Container maxWidth="lg">
        <Toolbar 
          disableGutters
          sx={{
            py: 4,
            display: 'flex',
            justifyContent: 'space-between',
            minHeight: 'auto',
          }}
        >
          <Box
            component={Link}
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Logo loading="eager" priority="high" />
            <LogoTitle />
          </Box>
          <HeaderNav data={data} />
        </Toolbar>
      </Container>
    </AppBar>
  )
}