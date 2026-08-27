'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/utilities/getSessionUser'
import { LoanRuleError } from '../domain/errors'
import { requestExtension } from '../services'
import { relationId } from '../services/shared'

export async function extendReservation(reservationId: number) {
  const { payload, user } = await getSessionUser()
  if (!user) throw new LoanRuleError('sin-permiso')

  const reservation = await requestExtension({
    payload,
    user,
    reservationId,
    now: new Date(),
  })

  revalidatePath(`/catalog/${relationId(reservation.item)}`)
}
