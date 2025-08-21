'use client'

import React from 'react'
import { Box, Button } from '@mui/material'
import { usePayloadSession } from 'payload-authjs/client'
import { signInAction } from '@/payload/plugins/authjs/signIn'
import { CMSLink } from '@/components/legacy/Link'

import type { Header as HeaderType } from '@/payload-types'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const { session } = usePayloadSession()
  const user = session?.user
  const navItems = data?.navItems || []

  return (
    <Box
      component="nav"
      sx={{
        display: { xs: 'none', md: 'flex' },
        gap: 1.5,
        alignItems: 'center',
      }}
    >
      <CMSLink
        type="reference"
        label="Catalogo"
        url="/catalog"
        appearance="link"
      />
      <CMSLink
        type="reference"
        label="Foro"
        url="https://foro.pafe-formakuntza.com/"
        appearance="link"
      />
      
      {user && (
        <CMSLink
          type="reference"
          label="Casos"
          url="/cases"
          appearance="link"
        />
      )}

      {!user && (
        <Button 
          variant="contained"
          onClick={async () => await signInAction()}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 2,
            px: 3,
            py: 1,
          }}
        >
          Entrar
        </Button>
      )}
      
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
    </Box>
  )
}