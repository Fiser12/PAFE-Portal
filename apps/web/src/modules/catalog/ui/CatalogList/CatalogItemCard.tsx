'use client'

import type { CatalogItem, Media } from '@/payload-types'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Props {
    item: CatalogItem
}

export function CatalogItemCard({ item }: Props) {
    const router = useRouter()
    const cover = typeof item.cover === 'object' && item.cover ? item.cover as Media : undefined
    const reserved = item.reservations?.docs?.length ?? 0
    const total = item.quantity ?? 0
    const available = Math.max(total - reserved, 0)

    return (
        <div
            className="bg-white rounded shadow p-3 flex flex-col items-center mx-auto cursor-pointer hover:shadow-lg transition-shadow"
            style={{ width: 200, minHeight: 340 }}
            onClick={() => router.push(`/catalog/${item.id}`)}
        >
            {cover?.url && (
                <div className="relative w-full mb-2" style={{ aspectRatio: '1 / 1.414', width: 180, minHeight: 254 }}>
                    <Image
                        src={cover.url}
                        alt={cover.alt ?? item.title}
                        fill
                        style={{ objectFit: 'cover', borderRadius: 7 }}
                    />
                </div>
            )}
            <h3
                className="text-lg font-semibold mb-1 text-center leading-tight w-full truncate"
                title={item.title}
                style={{ maxWidth: 200 }}
            >
                {item.title}
            </h3>
            <span className="text-sm text-gray-600">
                <strong>{available} disponibles</strong> de {total}
            </span>
        </div>
    )
} 