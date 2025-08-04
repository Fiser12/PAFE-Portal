'use client'

import { checkRole } from '@/core/permissions'
import { usePayloadSession } from 'payload-authjs/client'
import { AdminButton } from './AdminButton'
import { UserButton } from './UserButton'

interface Props {
    itemId: number
    userId: string
    onReservationSuccess?: () => void
}

export function ReservationButton({ itemId, userId, onReservationSuccess }: Props) {
    const { session } = usePayloadSession()
    const isCatalogAdmin = checkRole({ roleSlug: 'catalog-admin', user: session?.user })

    if (isCatalogAdmin) {
        return <AdminButton itemId={itemId} onReservationSuccess={onReservationSuccess} />
    }

    return <UserButton itemId={itemId} userId={userId} onReservationSuccess={onReservationSuccess} />
} 