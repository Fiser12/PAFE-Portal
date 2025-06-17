'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function checkUserReservation(itemId: number, userId: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    const existingReservation = await payload.find({
      collection: 'reservation',
      where: {
        and: [{ item: { equals: itemId } }, { user: { equals: userId } }],
      },
    })

    return {
      hasReservation: existingReservation.totalDocs > 0,
      reservationDate: existingReservation.docs[0]?.reservationDate ?? null,
    }
  } catch (error) {
    console.error('Error al verificar la reserva:', error)
    throw error
  }
}
