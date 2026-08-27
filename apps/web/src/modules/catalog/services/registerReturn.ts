import { isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { canTransition } from '../domain/lifecycle'
import { madridDateOf } from '../domain/loan-terms'
import { lateReturnEmail } from '../domain/messages'
import { registerLateReturn } from '../domain/penalties'
import {
  dayOf,
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

export const registerReturn = async ({
  payload,
  user,
  reservationId,
  now,
}: ServiceContext & { reservationId: number }): Promise<Reservation> => {
  if (!isStaff(user)) fail('sin-permiso')

  const reservation = await loadReservation(payload, reservationId)
  if (!canTransition(reservation.status, 'devuelta')) fail('transicion-invalida')

  const returnISO = madridDateOf(now)
  const dueISO = dayOf(reservation.dueDate)
  const late = Boolean(dueISO && returnISO > dueISO)

  const returned = await payload.update({
    collection: 'reservation',
    id: reservationId,
    data: {
      status: 'devuelta',
      returnedAt: dayToInstant(returnISO),
      returnedLate: late,
    },
    overrideAccess: true,
  })

  const title = await loadItemTitle(payload, relationId(reservation.item))
  await notify({
    payload,
    userId: relationId(reservation.user),
    reservationId,
    type: late ? 'devolucion-tardia' : 'devolucion',
    title,
  })

  if (late) await applyLateReturn({ payload, reservation, returnISO, title })

  return returned
}

const applyLateReturn = async ({
  payload,
  reservation,
  returnISO,
  title,
}: {
  payload: Awaited<ServiceContext['payload']>
  reservation: Reservation
  returnISO: string
  title: string
}): Promise<void> => {
  const owner = await loadUser(payload, relationId(reservation.user))

  const penalty = registerLateReturn({
    lateCount: owner.lateReturnsCount ?? 0,
    returnedAtISO: returnISO,
  })

  await payload.update({
    collection: 'users',
    id: owner.id,
    data: {
      lateReturnsCount: penalty.lateCount,
      ...(penalty.penalizedUntilISO
        ? { penalizedUntil: dayToInstant(penalty.penalizedUntilISO) }
        : {}),
    },
    overrideAccess: true,
  })

  await sendEmailSafely(payload, { to: owner.email, ...lateReturnEmail({ title }) })
}
