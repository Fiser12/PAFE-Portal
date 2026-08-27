export type ReservationStatus = 'reservada' | 'activa' | 'devuelta' | 'perdida' | 'cancelada'

/** Estados que comprometen un ejemplar y ocupan cupo de la familia */
export const LIVE_STATUSES: readonly ReservationStatus[] = ['reservada', 'activa', 'perdida']

const TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  reservada: ['activa', 'cancelada'],
  activa: ['devuelta', 'perdida'],
  devuelta: [],
  perdida: [],
  cancelada: [],
}

export const canTransition = (from: ReservationStatus, to: ReservationStatus): boolean =>
  TRANSITIONS[from].includes(to)

export const isLive = (status: ReservationStatus): boolean => LIVE_STATUSES.includes(status)
