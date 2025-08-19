'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/legacy/Link'
import { usePayloadSession } from 'payload-authjs/client'
import { signInAction } from '@/payload/plugins/authjs/signIn'
import { Button, type ButtonProps } from '@/components/legacy/button'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const { session } = usePayloadSession()
  const user = session?.user

  const navItems = data?.navItems || []

  return (
    <nav className="hidden md:flex gap-3 items-center">
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

      {!user && (
        <Button onClick={async () => await signInAction()}>Entrar</Button>
      )}
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
    </nav>
  )
}
