import type { ReservationStatus } from '../domain/lifecycle'
import type { ReservationAction } from '../domain/actions'

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  reservada: 'Pendiente de recoger',
  activa: 'En préstamo',
  devuelta: 'Devuelta',
  perdida: 'Perdida o rota',
  cancelada: 'Cancelada',
}

export const STATUS_VARIANTS: Record<ReservationStatus, 'success' | 'secondary' | 'destructive'> = {
  reservada: 'secondary',
  activa: 'success',
  devuelta: 'secondary',
  perdida: 'destructive',
  cancelada: 'secondary',
}

export const ACTION_LABELS: Record<ReservationAction, string> = {
  cancelar: 'Cancelar',
  recoger: 'Registrar recogida',
  devolver: 'Devolver',
  perdida: 'Marcar pérdida',
  prorrogar: 'Prorrogar 2 semanas',
  reponer: 'Registrar reposición',
}

export const formatDay = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString('es-ES') : '—'
