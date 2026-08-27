import type { Payload } from 'payload'
import { isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { canTransition } from '../domain/lifecycle'
import { fail, loadReservation, relationId, type Actor } from './shared'

export const cancelReservation = async ({
  payload,
  user,
  reservationId,
}: {
  payload: Payload
  user: Actor
  reservationId: number
}): Promise<Reservation> => {
  const reservation = await loadReservation(payload, reservationId)
  const ownerId = relationId(reservation.user)

  if (String(ownerId) !== String(user.id) && !isStaff(user)) fail('sin-permiso')
  if (!canTransition(reservation.status, 'cancelada')) fail('transicion-invalida')

  return payload.update({
    collection: 'reservation',
    id: reservationId,
    data: { status: 'cancelada' },
    overrideAccess: true,
  })
}
