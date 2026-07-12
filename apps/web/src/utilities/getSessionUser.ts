import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import type { User } from '@/payload-types'

/**
 * Resuelve el usuario de la sesión actual para server actions.
 * Las server actions usan la Local API (que NO pasa por el access de las
 * colecciones), así que cada acción debe autorizar con este usuario.
 */
export const getSessionUser = async (): Promise<{
  payload: Payload
  user: User | null
}> => {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user: (user as User) ?? null }
}
