'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/utilities/getSessionUser'
import { LoanRuleError } from '../domain/errors'
import { registerReplacement, reportLoss as report } from '../services'
import { relationId } from '../services/shared'

export async function reportLoss(reservationId: number) {
  const { payload, user } = await getSessionUser()
  if (!user) throw new LoanRuleError('sin-permiso')

  const reservation = await report({ payload, user, reservationId, now: new Date() })

  revalidatePath(`/catalog/${relationId(reservation.item)}`)
}

export async function registerReplacementAction(reservationId: number) {
  const { payload, user } = await getSessionUser()
  if (!user) throw new LoanRuleError('sin-permiso')

  const reservation = await registerReplacement({
    payload,
    user,
    reservationId,
    now: new Date(),
  })

  revalidatePath(`/catalog/${relationId(reservation.item)}`)
}
