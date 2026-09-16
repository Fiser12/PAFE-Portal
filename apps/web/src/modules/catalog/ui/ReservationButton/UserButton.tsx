'use client'

import { useTransition } from 'react'
import { createReservation } from '../../actions'
import { useTextos } from '@/components/IdiomaProvider'

interface Props {
    itemId: number
    userId: string
    onReservationSuccess?: () => void
}

export function UserButton({ itemId, userId, onReservationSuccess }: Props) {
  const t = useTextos()
    const [isPending, startTransition] = useTransition()

    const handleReservation = () => {
        startTransition(async () => {
            try {
                await createReservation(itemId, userId)
                onReservationSuccess?.()
            } catch (error) {
                console.error(t.reservaErrorCrear, error)
            }
        })
    }

    return (
        <button
            onClick={handleReservation}
            disabled={isPending}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? t.reservaReservando : t.reservaReservarLibro}
        </button>
    )
} 