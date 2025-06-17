'use server'

import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

export async function returnBook(reservationId: number) {
  const payload = await getPayload({ config: configPromise })

  const reservation = await payload.findByID({
    collection: 'reservation',
    id: reservationId,
  })

  if (!reservation) {
    throw new Error('Reserva no encontrada')
  }

  const itemId = typeof reservation.item === 'object' ? reservation.item.id : reservation.item

  const catalogItem = await payload.findByID({
    collection: 'catalog-item',
    id: itemId,
  })

  if (!catalogItem) {
    throw new Error('Libro no encontrado')
  }

  await payload.delete({
    collection: 'reservation',
    id: reservationId,
  })

  revalidatePath(`/catalog/${catalogItem.id}`)
}
