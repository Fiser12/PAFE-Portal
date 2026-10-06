import { isAdmin, isStaff } from '@/core/permissions'
import { esArea, type AreaDelTablon } from './areas'
import type { TablonRuleCode } from './errors'

/**
 * Lo que se ofrece en el foro sobre una noticia. Archivar es del equipo (R14);
 * editar lleva al panel, que solo abre administración. Mover cambia quién la
 * ve, así que también es de administración.
 */
export const moderacionPara = (user: Parameters<typeof isStaff>[0]) => ({
  archivar: isStaff(user),
  editar: isAdmin(user),
  mover: isAdmin(user),
})

export type Moderacion = ReturnType<typeof moderacionPara>

export type AccionEnBloque =
  { tipo: 'archivar' } | { tipo: 'desarchivar' } | { tipo: 'mover'; area: string }

export type CambioEnBloque =
  | { ok: true; data: { archivada: boolean } | { area: AreaDelTablon } }
  | { ok: false; code: TablonRuleCode }

export const cambioEnBloque = (puede: Moderacion, accion: AccionEnBloque): CambioEnBloque => {
  if (accion.tipo === 'mover') {
    if (!puede.mover) return { ok: false, code: 'sin-permiso' }
    if (!esArea(accion.area)) return { ok: false, code: 'area-requerida' }
    return { ok: true, data: { area: accion.area } }
  }
  if (!puede.archivar) return { ok: false, code: 'sin-permiso' }
  return { ok: true, data: { archivada: accion.tipo === 'archivar' } }
}

export const MAXIMO_EN_BLOQUE = 100

export const idsSeleccionados = (ids: readonly number[]): number[] =>
  [...new Set(ids.filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, MAXIMO_EN_BLOQUE)
