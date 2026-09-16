'use server'

import type { Noticia } from '@/payload-types'
import { isActiveUser, isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import { noticiasDelTablon } from '../services'
import { AREAS_DEL_TABLON, areasVisiblesPara } from '../domain/areas'

export interface TablonData {
  noticias: Noticia[]
  areas: { value: string; label: string }[]
  /** Sin rol no se ve el tablón, y hay que poder distinguirlo de un tablón vacío */
  acceso: 'ok' | 'sin-permiso'
}

const SIN_PERMISO: TablonData = {
  noticias: [],
  areas: [],
  acceso: 'sin-permiso',
}

const etiqueta = (value: string) =>
  AREAS_DEL_TABLON.find((area) => area.value === value)?.label ?? value

/** Nombres de los grupos del usuario, para las áreas que exigen pertenecer a uno */
const nombresDeSusGrupos = (user: { groups?: unknown }): string[] =>
  Array.isArray(user.groups)
    ? user.groups
        .map((g) => (typeof g === 'object' && g !== null ? (g as { name?: string }).name : null))
        .filter((n): n is string => typeof n === 'string')
    : []

/** Todo lo que necesita el tablón: lo publicado, las áreas y a cuáles sigo */
export const cargarTablon = async (
  area?: string,
  archivadas = false,
): Promise<TablonData> => {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return SIN_PERMISO

  const noticias = await noticiasDelTablon({ payload, user, area, archivadas, now: new Date() })
  const areas = areasVisiblesPara({
    grupos: nombresDeSusGrupos(user),
    esStaff: isStaff(user),
  }).map((value) => ({ value, label: etiqueta(value) }))

  return { noticias, areas, acceso: 'ok' }
}
