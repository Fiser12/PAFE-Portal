import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
}

export const LogoTitle = (props: Props) => {
  const { className } = props

  return (
    <h1 
      className={clsx('text-3xl font-bubblegum text-primary', className)} 
      style={{ 
        fontWeight: '900',
        textShadow: '0 0 1px currentColor'
      }}
    >
      PAFE
    </h1>
  )
}