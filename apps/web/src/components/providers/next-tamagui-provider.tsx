'use client'

import '@tamagui/core/reset.css'
import '@tamagui/font-inter/css/400.css'
import '@tamagui/font-inter/css/700.css'
import '@tamagui/polyfill-dev'

import { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { useServerInsertedHTML } from 'next/navigation'
import { NextThemeProvider, useRootTheme } from '@tamagui/next-theme'
import { TamaguiProvider } from 'tamagui'
import tamaguiConfig from '@/../tamagui.config'

export const NextTamaguiProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useRootTheme()

  useServerInsertedHTML(() => {
    // @ts-ignore
    const rnwStyle = StyleSheet.getSheet()
    return (
      <>
        <link rel="stylesheet" href="/tamagui.css" />
        <style
          dangerouslySetInnerHTML={{ __html: rnwStyle.textContent }}
          id={rnwStyle.id}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: tamaguiConfig.getCSS({
              exclude: process.env.NODE_ENV === 'production' ? 'design-system' : null,
            }),
          }}
        />
      </>
    )
  })

  return (
    <NextThemeProvider
      skipNextHead
      onChangeTheme={(next) => {
        setTheme(next as any)
      }}
    >
      <TamaguiProvider config={tamaguiConfig} disableRootThemeClass defaultTheme={theme}>
        {children}
      </TamaguiProvider>
    </NextThemeProvider>
  )
}