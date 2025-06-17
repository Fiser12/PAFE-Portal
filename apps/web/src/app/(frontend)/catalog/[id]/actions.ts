'use server'

import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

export async function createReservation(itemId: number, userId: string) {
  const payload = await getPayload({ config: configPromise })

  const existingReservation = await payload.find({
    collection: 'reservation',
    where: {
      and: [{ item: { equals: itemId } }, { user: { equals: userId } }],
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

  await payload.update({
    collection: 'catalog-item',
    id: catalogItem.id,
    data: {
      quantity: (catalogItem.quantity || 0) + 1,
    },
  })

  revalidatePath(`/catalog/${catalogItem.id}`)
}
