'use client'

import { useState, useTransition } from 'react'
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
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={isPending}
                className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? t.reservaReservando : t.reservaReservarParaUsuario}
            </button>

            <UserSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleReservation}
            />
        </>
    )
} 