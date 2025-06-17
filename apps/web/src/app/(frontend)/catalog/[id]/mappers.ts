import { Reservation, User } from '@/payload-types'

export interface FormattedReservation {
  id: number
  user: User
  reservationDate: string
}

export const mapReservations = (reservations: Reservation[]): FormattedReservation[] => {
  return reservations
    .map((reservation) => ({
      id: reservation.id,
      user: typeof reservation.user === 'object' ? (reservation.user as User) : null,
      reservationDate: reservation.reservationDate,
    }))
    .filter((reservation) => reservation.user !== null) as FormattedReservation[]
}
