import { useSWRConfig } from 'swr'

const ARRAY_KEYS = ['item-availability', 'item-reservations', 'user-reservations']

/**
 * Invalida todas las claves SWR afectadas al crear o devolver una reserva:
 * disponibilidad del item, tablas de reservas y el estado "ya reservado" del
 * usuario. Así la página de detalle se actualiza sola tras reservar/devolver.
 */
export function useReservationsRefresh() {
  const { mutate } = useSWRConfig()

  return () => {
    mutate((key) => Array.isArray(key) && ARRAY_KEYS.includes(key[0] as string))
    mutate((key) => typeof key === 'string' && key.startsWith('reservation-'))
  }
}
