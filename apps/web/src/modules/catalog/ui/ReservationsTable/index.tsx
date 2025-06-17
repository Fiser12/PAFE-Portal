'use client'

import type { Reservation } from '@/payload-types'
import { usePayloadSession } from 'payload-authjs/client'
import { useEffect, useState } from 'react'
import { getItemReservations, getUserReservations, returnBook } from '../../actions'
import { Card } from './Card'
import { Row } from './Row'

interface Props {
    itemId?: number
}

export function ReservationsTable({ itemId }: Props) {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { session } = usePayloadSession()
    const user = session?.user

    useEffect(() => {
        const loadReservations = async () => {
            try {
                if (itemId) {
                    const result = await getItemReservations(itemId)
                    setReservations(result.docs)
                } else if (user) {
                    const result = await getUserReservations(user.id)
                    setReservations(result.docs)
                }
            } catch (error) {
                console.error('Error al cargar las reservas:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadReservations()
    }, [itemId, user])

    const handleReturn = async (reservationId: number) => {
        try {
            await returnBook(reservationId)
            if (itemId) {
                const result = await getItemReservations(itemId)
                setReservations(result.docs)
            } else if (user) {
                const result = await getUserReservations(user.id)
                setReservations(result.docs)
            }
            window.location.reload()
        } catch (error) {
            console.error('Error al devolver el libro:', error)
        }
    }

    if (isLoading) {
        return <div>Cargando reservas...</div>
    }

    if (reservations.length === 0) {
        return <div>No hay reservas {itemId ? 'para este libro' : 'activas'}</div>
    }

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
                {itemId ? 'Reservas actuales' : 'Mis reservas'}
            </h2>
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