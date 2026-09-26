'use client'

import useSWR from 'swr'
import type { User } from '@/payload-types'

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error(`No se pudo comprobar la sesión (${response.status})`)
  return response.json()
}

export function useUser() {
  const { data, isLoading } = useSWR<{ user: User | null }>('/api/users/me', fetcher)
  const { data: access } = useSWR<{ tecnico: boolean }>(
    data?.user ? ['/api/portal-access', data.user.id] : null,
    ([url]: [string, number]) => fetcher(url),
  )
  return { user: data?.user ?? null, isLoading, tecnico: access?.tecnico === true }
}
