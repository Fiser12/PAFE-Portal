import type { Payload } from 'payload'
import { liveReservationsWhere } from './shared'

export const getAvailability = async ({
  payload,
  itemId,
}: {
  payload: Payload
  itemId: number
}): Promise<{ total: number; available: number }> => {
  const item = await payload.findByID({
    collection: 'catalog-item',
    id: itemId,
    depth: 0,
    overrideAccess: true,
  })
  const total = item.quantity ?? 0

  const live = await payload.count({
    collection: 'reservation',
    where: liveReservationsWhere({ item: { equals: itemId } }),
    overrideAccess: true,
  })

  return { total, available: Math.max(total - live.totalDocs, 0) }
}
