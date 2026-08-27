import { isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { canTransition } from '../domain/lifecycle'
import { computeDueDate, madridDateOf, tuesdayOfWeek } from '../domain/loan-terms'
import {
  dayToInstant,
  fail,
  isOwnerPenalizedAt,
  loadItemTitle,
  loadReservation,
  loadUser,
  relationId,
  type ServiceContext,
} from './shared'
import { notify } from './notifications'

export const registerPickup = async ({
  payload,
  user,
  reservationId,
  pickupDate,
  now,
}: ServiceContext & {
  reservationId: number
  pickupDate?: Date
}): Promise<Reservation> => {
  if (!isStaff(user)) fail('sin-permiso')

  const reservation = await loadReservation(payload, reservationId)
  if (!canTransition(reservation.status, 'activa')) fail('transicion-invalida')

  const owner = await loadUser(payload, relationId(reservation.user))
  const pickupISO = tuesdayOfWeek(madridDateOf(pickupDate ?? now))
  const dueISO = computeDueDate(pickupISO, { penalized: isOwnerPenalizedAt(owner, now) })

  const active = await payload.update({
    collection: 'reservation',
    id: reservationId,
    data: {
      status: 'activa',
      pickupDate: dayToInstant(pickupISO),
      dueDate: dayToInstant(dueISO),
    },
    overrideAccess: true,
  })

  await notify({
    payload,
    userId: owner.id,
    reservationId,
    type: 'recogida',
    title: await loadItemTitle(payload, relationId(reservation.item)),
    dueISO,
  })

  return active
}
