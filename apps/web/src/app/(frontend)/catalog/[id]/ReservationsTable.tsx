'use client'

import type { Reservation, User } from '@/payload-types'
import { useEffect, useState } from 'react'
import { getItemReservations, returnBook } from './actions'

interface Props {
    itemId: number
}

export function ReservationsTable({ itemId }: Props) {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadReservations = async () => {
            try {
                const result = await getItemReservations(itemId)
                setReservations(result.docs)
            } catch (error) {
                console.error('Error al cargar las reservas:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadReservations()
    }, [itemId])

    const handleReturn = async (reservationId: number) => {
        try {
            await returnBook(reservationId)
            const result = await getItemReservations(itemId)
            setReservations(result.docs)
            window.location.reload()
        } catch (error) {
            console.error('Error al devolver el libro:', error)
        }
    }

    const getUserEmail = (user: User | string) => {
        if (typeof user === 'string') return user
        return user.email
    }

    if (isLoading) {
        return <div>Cargando reservas...</div>
    }

    if (reservations.length === 0) {
        return <div>No hay reservas para este libro</div>
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Reservas actuales</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
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
                            <tr key={reservation.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getUserEmail(reservation.user)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(reservation.reservationDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleReturn(reservation.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Devolver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
} 