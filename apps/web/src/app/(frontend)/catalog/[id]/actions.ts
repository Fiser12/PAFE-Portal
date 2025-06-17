'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function createReservation(itemId: number, userId: string) {
  const payload = await getPayload({ config: configPromise })

  const existingReservation = await payload.find({
    collection: 'reservation',
    where: {
      and: [
        { item: { equals: itemId } },
        { user: { equals: userId } },
      ],
    },
  })

  if (existingReservation.totalDocs > 0) {
    throw new Error('Ya tienes una reserva de este libro')
  }

  const catalogItem = await payload.findByID({
    collection: 'catalog-item',
    id: itemId,
  })

  if (!catalogItem || !catalogItem.quantity || catalogItem.quantity <= 0) {
    throw new Error('No hay ejemplares disponibles')
  }

  await payload.create({
    collection: 'reservation',
    data: {
      item: itemId,
      user: userId,
      reservationDate: new Date().toISOString(),
    },
  })

  await payload.update({
    collection: 'catalog-item',
    id: itemId,
    data: {
      quantity: catalogItem.quantity - 1,
    },
  })

  revalidatePath(`/catalog/${itemId}`)
}
