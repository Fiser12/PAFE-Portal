'use server'

import { revalidatePath } from 'next/cache'
import type { Noticia, Taxonomy } from '@/payload-types'
import { isActiveUser } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import { areasDelTablon, elegirAreas, noticiasDelTablon } from '../services'

export interface TablonData {
  noticias: Noticia[]
  areas: Taxonomy[]
  suscritas: number[]
  /** Sin rol no se ve el tablón, y hay que poder distinguirlo de un tablón vacío */
  acceso: 'ok' | 'sin-permiso'
}

const SIN_PERMISO: TablonData = {
  noticias: [],
  areas: [],
  suscritas: [],
  acceso: 'sin-permiso',
}

/** Todo lo que necesita el tablón: lo publicado, las áreas y a cuáles sigo */
export const cargarTablon = async (areaId?: number): Promise<TablonData> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return SIN_PERMISO

  const [noticias, areas] = await Promise.all([
    noticiasDelTablon({ payload, user, areaId, now: new Date() }),
    areasDelTablon(payload),
  ])

  const suscritas = (user.areasSuscritas ?? []).map((area) =>
    typeof area === 'object' && area !== null ? Number(area.id) : Number(area),
  )

  return { noticias, areas, suscritas, acceso: 'ok' }
}

/** Devuelve si llegó a guardarse, para que la interfaz no dé por hecho que sí */
export const guardarAreasSuscritas = async (areaIds: number[]): Promise<boolean> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return false

  await elegirAreas({ payload, user, areaIds })
  revalidatePath('/')
  return true
}
