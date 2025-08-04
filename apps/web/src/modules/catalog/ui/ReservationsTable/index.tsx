'use client'

import type { Reservation } from '@/payload-types'
import { usePayloadSession } from 'payload-authjs/client'
import useSWR from 'swr'
import { getItemReservations, getUserReservations, returnBook } from '../../actions'
import { Card } from './Card'
import { Row } from './Row'

interface Props {
    itemId?: number
}

const fetcher = async (key: [string, number | string]) => {
    const [type, id] = key
    if (type === 'item-reservations') {
        const result = await getItemReservations(id as number)
        return result.docs
    } else if (type === 'user-reservations') {
        const result = await getUserReservations(id as string)
        return result.docs
    }
    return []
}

export function ReservationsTable({ itemId }: Props) {
    const { session } = usePayloadSession()
    const user = session?.user

    const swrKey = itemId 
        ? ['item-reservations', itemId] as const
        : user?.id 
            ? ['user-reservations', user.id] as const
            : null

    const { data: reservations, mutate, isLoading, error } = useSWR(
        swrKey,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
        }
    )

    const handleReturn = async (reservationId: number) => {
        try {
            await returnBook(reservationId)
            // Revalidar los datos automáticamente
            mutate()
        } catch (error) {
            console.error('Error al devolver el libro:', error)
        }
    }

    if (isLoading) {
        return <div>Cargando reservas...</div>
    }

    const h2Title = <h2 className="text-2xl font-bold mb-4">
        {itemId ? 'Reservas actuales' : 'Mis reservas'}
    </h2>


    if (!reservations || reservations.length === 0) {
        return <div>
            {h2Title}
            No hay reservas {itemId ? 'para este libro' : 'activas'}
        </div>
    }

    return (
        <div className="mt-8">
            {h2Title}
            <div className="overflow-x-auto">
                <div className="min-w-full divide-y divide-gray-200">
                    {/* Desktop view */}
                    <div className="hidden md:block">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    {!itemId && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Libro
                                        </th>
                                    )}
                                    {itemId && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha de reserva
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reservations.map((reservation) => (
                                    <Row
                                        key={reservation.id}
                                        reservation={reservation}
                                        itemId={itemId}
                                        onReturn={handleReturn}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile view */}
                    <div className="md:hidden">
                        {reservations.map((reservation) => (
                            <Card
                                key={reservation.id}
                                reservation={reservation}
                                itemId={itemId}
                                onReturn={handleReturn}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
} 