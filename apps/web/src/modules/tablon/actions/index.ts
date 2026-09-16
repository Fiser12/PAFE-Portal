'use server'

import { revalidatePath } from 'next/cache'
import type { Noticia, Taxonomy } from '@/payload-types'
import { getSessionUser } from '@/utilities/getSessionUser'
import { areasDelTablon, elegirAreas, noticiasDelTablon } from '../services'

export interface TablonData {
  noticias: Noticia[]
  areas: Taxonomy[]
  suscritas: number[]
}

/** Todo lo que necesita el tablón: lo publicado, las áreas y a cuáles sigo */
export const cargarTablon = async (areaId?: number): Promise<TablonData> => {
  const { payload, user } = await getSessionUser()
  if (!user) return { noticias: [], areas: [], suscritas: [] }

  const [noticias, areas] = await Promise.all([
    noticiasDelTablon({ payload, user, areaId, now: new Date() }),
    areasDelTablon(payload),
  ])

  const suscritas = (user.areasSuscritas ?? []).map((area) =>
    typeof area === 'object' && area !== null ? Number(area.id) : Number(area),
  )

  return { noticias, areas, suscritas }
}

export const guardarAreasSuscritas = async (areaIds: number[]): Promise<void> => {
  const { payload, user } = await getSessionUser()
  if (!user) return

  await elegirAreas({ payload, user, areaIds })
  revalidatePath('/')
}
