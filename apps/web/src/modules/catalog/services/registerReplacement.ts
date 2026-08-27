import { isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { madridDateOf } from '../domain/loan-terms'
import { dayToInstant, fail, loadReservation, type ServiceContext } from './shared'

export const registerReplacement = async ({
  payload,
  user,
  reservationId,
  now,
}: ServiceContext & { reservationId: number }): Promise<Reservation> => {
  if (!isStaff(user)) fail('sin-permiso')

  const reservation = await loadReservation(payload, reservationId)
  if (reservation.status !== 'perdida') fail('transicion-invalida')

  return payload.update({
    collection: 'reservation',
    id: reservationId,
    data: {
      loss: {
        ...reservation.loss,
        replacedAt: dayToInstant(madridDateOf(now)),
      },
    },
    overrideAccess: true,
  })
}
