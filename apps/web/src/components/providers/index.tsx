import React from 'react'

import { NextTamaguiProvider } from './next-tamagui-provider'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <NextTamaguiProvider>
      {children}
    </NextTamaguiProvider>
  )
}
