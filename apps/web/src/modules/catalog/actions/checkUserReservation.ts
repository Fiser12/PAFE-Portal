'use server'

import { isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import { LoanRuleError } from '../domain/errors'
import { liveReservationsWhere } from '../services/shared'

export async function checkUserReservation(itemId: number, userId: string) {
  const { payload, user } = await getSessionUser()

  if (!user || (String(userId) !== String(user.id) && !isStaff(user))) {
    throw new LoanRuleError('sin-permiso')
  }

  const live = await payload.find({
    collection: 'reservation',
    where: liveReservationsWhere({
      and: [{ item: { equals: itemId } }, { user: { equals: userId } }],
    }),
    limit: 1,
  })

  const reservation = live.docs[0]
  return {
    hasReservation: live.totalDocs > 0,
    reservationDate: reservation?.reservationDate ?? null,
    status: reservation?.status ?? null,
    dueDate: reservation?.dueDate ?? null,
  }
}
