'use client'

import { useTransition } from 'react'
import { returnBook } from '../actions'

interface Props {
    reservationId: number
    onReturnSuccess?: () => void
}

export function ReturnButton({ reservationId, onReturnSuccess }: Props) {
    const [isPending, startTransition] = useTransition()

    const handleReturn = () => {
        startTransition(async () => {
            try {
                await returnBook(reservationId)
                onReturnSuccess?.()
            } catch (error) {
                console.error('Error al devolver el libro:', error)
            }
        })
    }

    return (
        <button
            onClick={handleReturn}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground px-4 py-1 rounded hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? 'Devolviendo...' : 'Devolver'}
        </button>
    )
} 