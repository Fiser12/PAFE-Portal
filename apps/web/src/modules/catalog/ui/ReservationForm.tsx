'use client'

import { useUser } from '@/lib/auth/useUser'
import { useUserReservation } from '../hooks/useUserReservation'
import { useReservationsRefresh } from '../hooks/useReservationsRefresh'
import { ReservationButton } from './ReservationButton'
import { useTextos } from '@/components/IdiomaProvider'

interface Props {
    itemId: number
}

export function ReservationForm({ itemId }: Props) {
  const t = useTextos()
    const { user } = useUser()
    
    const { hasReservation, reservationDate, isLoading } = useUserReservation(
        itemId,
        user?.id ? String(user.id) : undefined
    )
    // Refresca disponibilidad, tabla de reservas y estado "ya reservado"
    const refreshReservations = useReservationsRefresh()

    if (!user?.id) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                    {t.reservaEntraParaReservar}
                </p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-muted-foreground">{t.cargando}</p>
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
                <ReservationButton
                    itemId={itemId}
                    userId={String(user.id)}
                    onReservationSuccess={refreshReservations}
                />
            )}
        </div>
    )
} 