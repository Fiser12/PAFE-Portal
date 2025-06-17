'use client'

import { useState, useTransition } from 'react'
import { createReservation } from '../../actions'
import { UserSelectionModal } from './UserSelectionModal'

interface Props {
    itemId: number
}

export function AdminButton({ itemId }: Props) {
    const [isPending, startTransition] = useTransition()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleReservation = (selectedUserId: string) => {
        startTransition(async () => {
            try {
                await createReservation(itemId, selectedUserId)
                setIsModalOpen(false)
                window.location.reload()
            } catch (error) {
                console.error('Error al crear la reserva:', error)
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={isPending}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? 'Reservando...' : 'Reservar para usuario'}
            </button>

            <UserSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleReservation}
            />
        </>
    )
} 