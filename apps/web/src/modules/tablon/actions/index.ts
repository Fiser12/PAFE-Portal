'use server'

import { revalidatePath } from 'next/cache'
import type { Noticia } from '@/payload-types'
import { isActiveUser } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import { elegirAreas, noticiasDelTablon } from '../services'
import { AREAS_DEL_TABLON } from '../domain/areas'

export interface TablonData {
  noticias: Noticia[]
  areas: { value: string; label: string }[]
  suscritas: string[]
  /** Sin rol no se ve el tablón, y hay que poder distinguirlo de un tablón vacío */
  acceso: 'ok' | 'sin-permiso'
}

const SIN_PERMISO: TablonData = {
  noticias: [],
  areas: [],
  suscritas: [],
  acceso: 'sin-permiso',
}

const AREAS = AREAS_DEL_TABLON.map(({ value, label }) => ({ value, label }))

/** Todo lo que necesita el tablón: lo publicado, las áreas y a cuáles sigo */
export const cargarTablon = async (area?: string): Promise<TablonData> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return SIN_PERMISO

  const noticias = await noticiasDelTablon({ payload, user, area, now: new Date() })

  return { noticias, areas: AREAS, suscritas: user.areasSuscritas ?? [], acceso: 'ok' }
}

/** Devuelve si llegó a guardarse, para que la interfaz no dé por hecho que sí */
export const guardarAreasSuscritas = async (areas: string[]): Promise<boolean> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return false

  await elegirAreas({ payload, user, areas })
  revalidatePath('/')
  return true
}
