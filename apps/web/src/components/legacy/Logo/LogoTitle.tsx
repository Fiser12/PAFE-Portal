import { cn } from '@/utilities/ui'
import React from 'react'

interface Props {
  className?: string
}

export const LogoTitle = (props: Props) => {
  const { className } = props

  return (
    <span
      className={cn(
        'font-bubblegum text-3xl font-black text-primary [text-shadow:0_0_1px_currentColor]',
        className,
      )}
    >
      PAFE
    </span>
  )
}
