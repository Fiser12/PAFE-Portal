'use client'

import type { Reservation, User } from '@/payload-types'
import Link from 'next/link'

interface Props {
    reservation: Reservation
    itemId?: number
    onReturn: (id: number) => Promise<void>
}

const getUserEmail = (user: User | string) => {
    if (typeof user === 'string') return user
    return user.email
}

export function Card({ reservation, itemId, onReturn }: Props) {
    return (
        <div className="bg-white p-4 mb-4 rounded-lg shadow">
            {!itemId && (
                <div className="mb-2">
                    <span className="text-sm font-medium text-gray-500">Libro:</span>
                    <Link
                        href={`/catalog/${typeof reservation.item === 'object' ? reservation.item.id : reservation.item}`}
                        className="ml-2 text-blue-600 hover:text-blue-900"
                    >
                        {typeof reservation.item === 'object' ? reservation.item.title : 'Cargando...'}
                    </Link>
                </div>
            )}
            {itemId && (
                <div className="mb-2">
                    <span className="text-sm font-medium text-gray-500">Usuario:</span>
                    <span className="ml-2">{getUserEmail(reservation.user)}</span>
                </div>
            )}
            <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">Fecha de reserva:</span>
                <span className="ml-2">{new Date(reservation.reservationDate).toLocaleDateString()}</span>
            </div>
            <div>
                <button
                    onClick={() => onReturn(reservation.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                >
                    Devolver
                </button>
            </div>
        </div>
    )
} 