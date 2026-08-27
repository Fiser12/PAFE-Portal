import { isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { canTransition } from '../domain/lifecycle'
import { addMonths, madridDateOf } from '../domain/loan-terms'
import { lossEmail } from '../domain/messages'
import {
  dayToInstant,
  fail,
  loadItemTitle,
  loadReservation,
  loadUser,
  relationId,
  sendEmailSafely,
  type ServiceContext,
} from './shared'
import { notify } from './notifications'

export const REPLACEMENT_MONTHS = 1

export const reportLoss = async ({
  payload,
  user,
  reservationId,
  now,
}: ServiceContext & { reservationId: number }): Promise<Reservation> => {
  if (!isStaff(user)) fail('sin-permiso')

  const reservation = await loadReservation(payload, reservationId)
  if (!canTransition(reservation.status, 'perdida')) fail('transicion-invalida')

  const reportedISO = madridDateOf(now)
  const lost = await payload.update({
    collection: 'reservation',
    id: reservationId,
    data: {
      status: 'perdida',
      loss: {
        reportedAt: dayToInstant(reportedISO),
        replacementDeadline: dayToInstant(addMonths(reportedISO, REPLACEMENT_MONTHS)),
      },
    },
    overrideAccess: true,
  })

  const owner = await loadUser(payload, relationId(reservation.user))
  const title = await loadItemTitle(payload, relationId(reservation.item))
  await sendEmailSafely(payload, { to: owner.email, ...lossEmail({ title }) })
  await notify({ payload, userId: owner.id, reservationId, type: 'perdida', title })

  return lost
}
