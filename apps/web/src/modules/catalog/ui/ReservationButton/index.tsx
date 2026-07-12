'use client'

import { isStaff } from '@/core/permissions'
import { useUser } from '@/lib/auth/useUser'
import { AdminButton } from './AdminButton'
import { UserButton } from './UserButton'

interface Props {
    itemId: number
    userId: string
    onReservationSuccess?: () => void
}

export function ReservationButton({ itemId, userId, onReservationSuccess }: Props) {
    const { user } = useUser()

    if (isStaff(user)) {
        return <AdminButton itemId={itemId} onReservationSuccess={onReservationSuccess} />
    }

    return <UserButton itemId={itemId} userId={userId} onReservationSuccess={onReservationSuccess} />
} 