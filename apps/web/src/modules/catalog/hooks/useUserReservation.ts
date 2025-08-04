import useSWR from 'swr'
import { checkUserReservation } from '../actions'

interface ReservationData {
  hasReservation: boolean
  reservationDate: string | null
}

export function useUserReservation(itemId: number, userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ReservationData>(
    userId ? `reservation-${itemId}-${userId}` : null,
    () => checkUserReservation(itemId, userId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    hasReservation: data?.hasReservation ?? false,
    reservationDate: data?.reservationDate ?? null,
    isLoading,
    error,
    refetch: mutate
  }
}