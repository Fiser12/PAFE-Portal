'use server'

import { revalidatePath } from 'next/cache'
import { isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

export async function returnBook(reservationId: number) {
  const { payload, user } = await getSessionUser()

  if (!user) {
    throw new Error('No tienes permiso para devolver reservas')
  }

  const reservation = await payload.findByID({
    collection: 'reservation',
    id: reservationId,
  })

  if (!reservation) {
    throw new Error('Reserva no encontrada')
  }

  const ownerId =
    typeof reservation.user === 'object' ? reservation.user.id : reservation.user

  // El staff gestiona cualquier reserva; una familia solo las suyas
  if (String(ownerId) !== String(user.id) && !isStaff(user)) {
    throw new Error('No tienes permiso para devolver esta reserva')
  }

  const itemId = typeof reservation.item === 'object' ? reservation.item.id : reservation.item

  await payload.delete({
    collection: 'reservation',
    id: reservationId,
  })

  revalidatePath(`/catalog/${itemId}`)
}
