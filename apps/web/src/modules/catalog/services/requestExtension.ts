import { isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { canRequestExtension, extendDueDate, madridDateOf } from '../domain/loan-terms'
import {
  assert,
  dayOf,
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

  const newDueISO = extendDueDate(dueISO as string)
  const extended = await payload.update({
    collection: 'reservation',
    id: reservationId,
    data: {
      dueDate: dayToInstant(newDueISO),
      extension: { requestedAt: dayToInstant(todayISO) },
    },
    overrideAccess: true,
  })

  await notify({
    payload,
    userId: ownerId,
    reservationId,
    type: 'prorroga',
    title: await loadItemTitle(payload, relationId(reservation.item)),
    dueISO: newDueISO,
  })

  return extended
}
