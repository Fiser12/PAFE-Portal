import { isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { canRequestExtension, extendDueDate, madridDateOf } from '../domain/loan-terms'
import {
  assert,
  dayOf,
  dayToInstant,
  fail,
  isOwnerPenalizedAt,
  loadReservation,
  loadUser,
  relationId,
  type ServiceContext,
} from './shared'

export const requestExtension = async ({
  payload,
  user,
  reservationId,
  now,
}: ServiceContext & { reservationId: number }): Promise<Reservation> => {
  const reservation = await loadReservation(payload, reservationId)
  const ownerId = relationId(reservation.user)
  if (String(ownerId) !== String(user.id) && !isStaff(user)) fail('sin-permiso')

  const owner = await loadUser(payload, ownerId)
  const todayISO = madridDateOf(now)
  const dueISO = dayOf(reservation.dueDate)

  assert(
    canRequestExtension({
      status: reservation.status,
      alreadyExtended: Boolean(reservation.extension?.requestedAt),
      penalized: isOwnerPenalizedAt(owner, now),
      todayISO,
      dueISO: dueISO ?? todayISO,
    }),
  )

  return payload.update({
    collection: 'reservation',
    id: reservationId,
    data: {
      dueDate: dayToInstant(extendDueDate(dueISO as string)),
      extension: { requestedAt: dayToInstant(todayISO) },
    },
    overrideAccess: true,
  })
}
