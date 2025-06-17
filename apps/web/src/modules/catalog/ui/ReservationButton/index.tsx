'use client'

import { checkRole } from '@/core/permissions'
import { usePayloadSession } from 'payload-authjs/client'
import { AdminButton } from './AdminButton'
import { UserButton } from './UserButton'

interface Props {
    itemId: number
    userId: string
}

export function ReservationButton({ itemId, userId }: Props) {
    const { session } = usePayloadSession()
    const isCatalogAdmin = checkRole({ roleSlug: 'catalog-admin', user: session?.user })

    if (isCatalogAdmin) {
        return <AdminButton itemId={itemId} />
    }

    return <UserButton itemId={itemId} userId={userId} />
} 