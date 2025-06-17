'use client'

import { useTransition } from 'react'
import { createReservation } from '../../actions'

interface Props {
    itemId: number
    userId: string
}

export function UserButton({ itemId, userId }: Props) {
    const [isPending, startTransition] = useTransition()

    const handleReservation = () => {
        startTransition(async () => {
            try {
                await createReservation(itemId, userId)
                window.location.reload()
            } catch (error) {
                console.error('Error al crear la reserva:', error)
            }
        })
    }

    return (
        <button
            onClick={handleReservation}
            disabled={isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? 'Reservando...' : 'Reservar libro'}
        </button>
    )
} 