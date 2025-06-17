'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function getItemAvailability(itemId: number) {
  try {
    const payload = await getPayload({ config: await configPromise })
    const item = await payload.findByID({
      collection: 'catalog-item',
      id: itemId,
      depth: 1,
    })

    if (!item) {
      throw new Error('Item not found')
    }

    const reserved = item.reservations?.docs?.length ?? 0
    const total = item.quantity ?? 0
    const available = Math.max(total - reserved, 0)

    return {
      available,
      total,
      reserved,
    }
  } catch (error) {
    console.error('Error getting item availability:', error)
    throw error
  }
}
