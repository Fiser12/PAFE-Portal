'use client'

import useSWR from 'swr'
import type { User } from '@/payload-types'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export function useUser() {
  const { data, isLoading } = useSWR<{ user: User | null }>('/api/users/me', fetcher)
  return { user: data?.user ?? null, isLoading }
}
