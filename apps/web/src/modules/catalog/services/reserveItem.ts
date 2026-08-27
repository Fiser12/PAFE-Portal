import { isActiveUser, isStaff } from '@/core/permissions'
import type { Reservation } from '@/payload-types'
import { checkQuota } from '../domain/quota'
import { madridDateOf } from '../domain/loan-terms'
import {
  assert,
  dayToInstant,
  fail,
  liveReservationsWhere,
  type ServiceContext,
} from './shared'
import { getAvailability } from './getAvailability'

export const reserveItem = async ({
  payload,
  user,
  itemId,
  forUserId,
  quotaOverrideReason,
  now,
}: ServiceContext & {
  itemId: number
  forUserId?: number
  quotaOverrideReason?: string
}): Promise<Reservation> => {
  if (!isActiveUser(user)) fail('sin-permiso')

  const ownerId = forUserId ?? user.id
  const staff = isStaff(user)
  if (String(ownerId) !== String(user.id) && !staff) fail('sin-permiso')

  const duplicated = await payload.count({
    collection: 'reservation',
    where: liveReservationsWhere({
      and: [{ item: { equals: itemId } }, { user: { equals: ownerId } }],
    }),
    overrideAccess: true,
  })
  if (duplicated.totalDocs > 0) fail('reserva-duplicada')

  const live = await payload.count({
    collection: 'reservation',
    where: liveReservationsWhere({ user: { equals: ownerId } }),
    overrideAccess: true,
  })
  assert(checkQuota({ liveCount: live.totalDocs, isStaff: staff, overrideReason: quotaOverrideReason }))

  const { available } = await getAvailability({ payload, itemId })
  if (available <= 0) fail('sin-stock')

  return payload.create({
    collection: 'reservation',
    data: {
      item: itemId,
      user: ownerId,
      status: 'reservada',
      reservationDate: dayToInstant(madridDateOf(now)),
      ...(quotaOverrideReason ? { quotaOverrideReason } : {}),
    },
    overrideAccess: true,
  })
}
