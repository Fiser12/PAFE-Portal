'use server'

import { isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

export async function checkUserReservation(itemId: number, userId: string) {
  try {
    const { payload, user } = await getSessionUser()

    if (!user || (String(userId) !== String(user.id) && !isStaff(user))) {
      throw new Error('No tienes permiso para consultar esta reserva')
    }
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
