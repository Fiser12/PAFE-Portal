'use server'

import { isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

export async function getItemReservations(itemId: number) {
  try {
    const { payload, user } = await getSessionUser()

    if (!isStaff(user)) {
      throw new Error('No tienes permiso para ver las reservas de este material')
    }
    const result = await payload.find({
      collection: 'reservation',
      where: {
        item: { equals: itemId },
      },
      depth: 1,
    })
    return result
  } catch (error) {
    console.error('Error al cargar las reservas:', error)
    throw error
  }
}
