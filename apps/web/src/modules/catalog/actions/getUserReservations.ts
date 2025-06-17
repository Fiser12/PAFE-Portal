'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function getUserReservations(userId: string) {
  try {
    const payload = await getPayload({ config: await configPromise })
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
