'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/utilities/getSessionUser'
import { LoanRuleError } from '../domain/errors'
import { reserveItem } from '../services'

export async function createReservation(
  itemId: number,
  userId: string,
  quotaOverrideReason?: string,
) {
  const { payload, user } = await getSessionUser()
  if (!user) throw new LoanRuleError('sin-permiso')

  await reserveItem({
    payload,
    user,
    itemId,
    forUserId: Number(userId),
    quotaOverrideReason,
    now: new Date(),
  })

  revalidatePath(`/catalog/${itemId}`)
}
