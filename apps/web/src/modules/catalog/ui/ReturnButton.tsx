'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { returnBook } from '../actions'
import { useTextos } from '@/components/IdiomaProvider'

interface Props {
    reservationId: number
    onReturnSuccess?: () => void
}

export function ReturnButton({ reservationId, onReturnSuccess }: Props) {
  const t = useTextos()
    const [isPending, startTransition] = useTransition()

    const handleReturn = () => {
        startTransition(async () => {
            try {
                await returnBook(reservationId)
                onReturnSuccess?.()
            } catch (error) {
                console.error(t.reservaErrorDevolver, error)
            }
        })
    }

    return (
        <Button variant="destructive" size="sm" onClick={handleReturn} disabled={isPending}>
            {isPending ? 'Devolviendo...' : 'Devolver'}
        </Button>
    )
} 