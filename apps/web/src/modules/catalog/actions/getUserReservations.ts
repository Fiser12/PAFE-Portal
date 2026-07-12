'use server'

import { isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

export async function getUserReservations(userId: string) {
  try {
    const { payload, user } = await getSessionUser()

    if (!user || (String(userId) !== String(user.id) && !isStaff(user))) {
      throw new Error('No tienes permiso para ver estas reservas')
    }
    const reservations = await payload.find({
      collection: 'reservation',
      where: {
        user: {
          equals: userId,
        },
      },
      depth: 2,
    })

    return reservations
  } catch (error) {
    console.error('Error getting user reservations:', error)
    throw error
  }
}
