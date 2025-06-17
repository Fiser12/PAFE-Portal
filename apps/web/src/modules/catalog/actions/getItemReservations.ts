'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function getItemReservations(itemId: number) {
  try {
    const payload = await getPayload({ config: configPromise })
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
