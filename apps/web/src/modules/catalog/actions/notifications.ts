'use server'

import { getSessionUser } from '@/utilities/getSessionUser'
import type { Notification } from '@/payload-types'
import { LoanRuleError } from '../domain/errors'
import { markNotificationsRead, userNotifications } from '../services'

export async function getMyNotifications(): Promise<Notification[]> {
  const { payload, user } = await getSessionUser()
  if (!user) throw new LoanRuleError('sin-permiso')

  return userNotifications({ payload, userId: user.id })
}

export async function markMyNotificationsRead(): Promise<void> {
  const { payload, user } = await getSessionUser()
  if (!user) throw new LoanRuleError('sin-permiso')

  await markNotificationsRead({ payload, user, now: new Date() })
}
