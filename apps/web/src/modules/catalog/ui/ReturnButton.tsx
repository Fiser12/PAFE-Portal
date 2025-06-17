'use client'

import { useTransition } from 'react'
import { returnBook } from '../actions'

interface Props {
    reservationId: number
}

export function ReturnButton({ reservationId }: Props) {
    const [isPending, startTransition] = useTransition()

    const handleReturn = () => {
        startTransition(async () => {
            try {
                await returnBook(reservationId)
                window.location.reload()
            } catch (error) {
                console.error('Error al devolver el libro:', error)
            }
        })
    }

    return (
        <button
            onClick={handleReturn}
            disabled={isPending}
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? 'Devolviendo...' : 'Devolver'}
        </button>
    )
} 