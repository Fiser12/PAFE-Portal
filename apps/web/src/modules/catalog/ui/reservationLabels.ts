import type { ReservationStatus } from '../domain/lifecycle'
import type { ReservationAction } from '../domain/actions'
import type { CodigoIdioma } from '@/core/localization'
import type { Textos } from '@/core/textos'

export const statusLabels = (t: Textos): Record<ReservationStatus, string> => ({
  reservada: t.estadoReservada,
  activa: t.estadoActiva,
  devuelta: t.estadoDevuelta,
  perdida: t.estadoPerdida,
  cancelada: t.estadoCancelada,
})

export const STATUS_VARIANTS: Record<ReservationStatus, 'success' | 'secondary' | 'destructive'> = {
  reservada: 'secondary',
  activa: 'success',
  devuelta: 'secondary',
  perdida: 'destructive',
  cancelada: 'secondary',
}

export const actionLabels = (t: Textos): Record<ReservationAction, string> => ({
  cancelar: t.accionCancelar,
  recoger: t.accionRecogida,
  devolver: t.accionDevolver,
  perdida: t.accionMarcarPerdida,
  prorrogar: t.accionProrrogar,
  reponer: t.accionReposicion,
})

/** Las fechas se escriben con las convenciones del idioma elegido */
export const formatDay = (value: string | null | undefined, idioma: CodigoIdioma = 'es'): string =>
  value ? new Date(value).toLocaleDateString(idioma === 'eu' ? 'eu-ES' : 'es-ES') : '—'
