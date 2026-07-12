'use server'

import { revalidatePath } from 'next/cache'
import { isActiveUser, isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

export async function createReservation(itemId: number, userId: string) {
  const { payload, user } = await getSessionUser()

  if (!user || !isActiveUser(user)) {
    throw new Error('No tienes permiso para reservar')
  }

  // Reservar en nombre de otro usuario es cosa del staff
  if (String(userId) !== String(user.id) && !isStaff(user)) {
    throw new Error('No tienes permiso para reservar en nombre de otro usuario')
  }

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
      user: Number(userId),
      reservationDate: new Date().toISOString(),
    },
  })

  revalidatePath(`/catalog/${itemId}`)
}
