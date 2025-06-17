'use client'

import { checkRole } from '@/core/permissions'
import { CatalogItem } from '@/payload-types'
import Image from 'next/image'
import { usePayloadSession } from 'payload-authjs/client'
import { useEffect, useState } from 'react'
import { getItemAvailability } from '../../actions'
import { ReservationForm } from '../ReservationForm'
import { ReservationsTable } from '../ReservationsTable'

interface Props {
    item: CatalogItem
    children: React.ReactNode
}

export function CatalogItemClient({ item, children }: Props) {
    const { session } = usePayloadSession()
    const user = session?.user
    const isCatalogAdmin = user ? checkRole({ roleSlug: 'catalog-admin', user }) : false
    const [availability, setAvailability] = useState<{ available: number; total: number; reserved: number } | null>(null)

    useEffect(() => {
        const loadAvailability = async () => {
            try {
                const data = await getItemAvailability(item.id)
                setAvailability(data)
            } catch (error) {
                console.error('Error loading availability:', error)
            }
        }
        loadAvailability()
    }, [item.id])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        {item.cover && typeof item.cover !== 'number' && (
                            <Image
                                alt={item.title}
                                className="h-auto rounded-lg shadow-md"
                                width={400}
                                height={700}
                                loading='lazy'
                                src={item.cover.url ?? ''}
                            />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
                        <div className="prose max-w-none mb-6">
                            {children}
                        </div>
                        <div className="mb-4">
                            <p className="text-lg">
                                <span className="font-semibold">Disponibles:</span> {availability?.available ?? 0} de {availability?.total ?? 0}
                            </p>
                        </div>
                        <ReservationForm itemId={item.id} />
                    </div>
                </div>
                {isCatalogAdmin && <ReservationsTable itemId={item.id} />}
            </div>
        </div>
    )
} 