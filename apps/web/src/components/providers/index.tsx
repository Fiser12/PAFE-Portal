import React from 'react'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
  )
}
