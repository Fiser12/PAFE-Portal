'use client'
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