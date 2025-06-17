'use client'

import type { User } from '@/payload-types'
import { usePayloadSession } from 'payload-authjs/client'
import { useEffect, useState } from 'react'
import { checkUserReservation } from '../actions'
import { ReservationButton } from './ReservationButton'

interface Props {
    itemId: number
}

export function ReservationForm({ itemId }: Props) {
    const { session } = usePayloadSession()
    const user = session?.user
    const [hasReservation, setHasReservation] = useState(false)
    const [reservationDate, setReservationDate] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkReservation = async () => {
            if (!user?.id) {
                setIsLoading(false)
                return
            }

            try {
                const { hasReservation, reservationDate } = await checkUserReservation(itemId, user.id)
                setHasReservation(hasReservation)
                setReservationDate(reservationDate)
            } catch (error) {
                console.error('Error al verificar la reserva:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkReservation()
    }, [user?.id, itemId])

    if (!user?.id) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                    Debes iniciar sesión para poder reservar este libro
                </p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600">Cargando...</p>
            </div>
        )
    }

    return (
        <div>
            {hasReservation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                        Ya tienes una reserva de este libro desde el{' '}
                        {reservationDate ? new Date(reservationDate).toLocaleDateString() : ''}
                    </p>
                </div>
            ) : (
                <ReservationButton itemId={itemId} userId={user.id} />
            )}
        </div>
    )
} 