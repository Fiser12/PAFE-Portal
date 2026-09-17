'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createReservation } from '../../actions'
import { UserSelectionModal } from './UserSelectionModal'
import { useTextos } from '@/components/IdiomaProvider'

interface Props {
    itemId: number
    onReservationSuccess?: () => void
}

export function AdminButton({ itemId, onReservationSuccess }: Props) {
  const t = useTextos()
    const [isPending, startTransition] = useTransition()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleReservation = (selectedUserId: string) => {
        startTransition(async () => {
            try {
                await createReservation(itemId, selectedUserId)
                setIsModalOpen(false)
                onReservationSuccess?.()
            } catch (error) {
                console.error(t.reservaErrorCrear, error)
            }
        })
    }

    return (
        <>
            <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsModalOpen(true)}
                disabled={isPending}
            >
                {isPending ? t.reservaReservando : t.reservaReservarParaUsuario}
            </Button>

            <UserSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleReservation}
            />
        </>
    )
} 