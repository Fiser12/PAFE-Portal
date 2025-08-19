import clsx from 'clsx'
import React from 'react'
import logoImg from './logo.png'
interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <img
      alt="PAFE Logo"
      width={120}
      height={60}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('max-w-[7.5rem] w-full h-[60px] object-contain', className)}
      src={logoImg.src}
    />
  )
}
