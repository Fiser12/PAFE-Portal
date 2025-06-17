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

export function Row({ reservation, itemId, onReturn }: Props) {
    return (
        <tr key={reservation.id}>
            {!itemId && (
                <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                        href={`/catalog/${typeof reservation.item === 'object' ? reservation.item.id : reservation.item}`}
                        className="text-blue-600 hover:text-blue-900"
                    >
                        {typeof reservation.item === 'object' ? reservation.item.title : 'Cargando...'}
                    </Link>
                </td>
            )}
            {itemId && (
                <td className="px-6 py-4 whitespace-nowrap">
                    {getUserEmail(reservation.user)}
                </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap">
                {new Date(reservation.reservationDate).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={() => onReturn(reservation.id)}
                    className="text-red-600 hover:text-red-900"
                >
                    Devolver
                </button>
            </td>
        </tr>
    )
} 