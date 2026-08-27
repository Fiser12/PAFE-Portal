'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/utilities/getSessionUser'
import { LoanRuleError } from '../domain/errors'
import { cancelReservation as cancel } from '../services'
import { relationId } from '../services/shared'

export async function cancelReservation(reservationId: number) {
  const { payload, user } = await getSessionUser()
  if (!user) throw new LoanRuleError('sin-permiso')

  const reservation = await cancel({ payload, user, reservationId })

  revalidatePath(`/catalog/${relationId(reservation.item)}`)
}
