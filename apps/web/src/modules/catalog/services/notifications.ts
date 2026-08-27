import type { Payload } from 'payload'
import { isStaff } from '@/core/permissions'
import type { Notification } from '@/payload-types'
import { notificationFor, type NotificationType } from '../domain/notifications'
import { madridDateOf } from '../domain/loan-terms'
import { dayToInstant, fail, type Actor } from './shared'

export const notify = async ({
  payload,
  userId,
  reservationId,
  type,
  title,
  dueISO,
}: {
  payload: Payload
  userId: number
  reservationId?: number
  type: NotificationType
  title: string
  dueISO?: string
}): Promise<void> => {
  const { message } = notificationFor({ type, title, dueISO })
  await payload.create({
    collection: 'notification',
    data: {
      user: userId,
      type,
      message,
      ...(reservationId ? { reservation: reservationId } : {}),
    },
    overrideAccess: true,
  })
}

export const userNotifications = async ({
  payload,
  userId,
  onlyUnread,
}: {
  payload: Payload
  userId: number
  onlyUnread?: boolean
}): Promise<Notification[]> => {
  const result = await payload.find({
    collection: 'notification',
    where: {
      and: [
        { user: { equals: userId } },
        ...(onlyUnread ? [{ readAt: { exists: false } }] : []),
      ],
    },
    sort: '-createdAt',
    depth: 0,
    limit: 0,
    overrideAccess: true,
  })
  return result.docs
}

export const markNotificationsRead = async ({
  payload,
  user,
  forUserId,
  now,
}: {
  payload: Payload
  user: Actor
  forUserId?: number
  now: Date
}): Promise<{ marked: number }> => {
  const ownerId = forUserId ?? user.id
  if (String(ownerId) !== String(user.id) && !isStaff(user)) fail('sin-permiso')

  const unread = await userNotifications({ payload, userId: ownerId, onlyUnread: true })
  const readAt = dayToInstant(madridDateOf(now))

  for (const notification of unread) {
    await payload.update({
      collection: 'notification',
      id: notification.id,
      data: { readAt },
      overrideAccess: true,
    })
  }

  return { marked: unread.length }
}
