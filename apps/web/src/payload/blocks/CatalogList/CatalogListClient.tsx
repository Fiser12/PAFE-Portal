'use client'

import type { CatalogItem, Media, Taxonomy } from '@/payload-types'
import Image from 'next/image'
import { useMemo, useState } from 'react'

interface CatalogListClientProps {
    catalogItems: CatalogItem[]
    categories: Taxonomy[]
}

const getCategoryId = (cat: number | Taxonomy) => typeof cat === 'number' ? cat : cat.id

const CatalogListClient = ({ catalogItems, categories }: CatalogListClientProps) => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

    const filteredItems = useMemo(() => {
        if (!selectedCategory) return catalogItems
        return catalogItems.filter(item =>
            item.categories.some(cat => getCategoryId(cat) === selectedCategory)
        )
    }, [catalogItems, selectedCategory])


    return (
        <div className="px-4">
            <div className="mb-4 w-full max-w-xs">
                <select
                    className="w-full px-3 py-2 border rounded"
                    value={selectedCategory ?? ''}
                    onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                >
                    <option value="">Todas las categorías</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.singular_name}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 justify-center">
                {filteredItems.map(item => {
                    const cover = typeof item.cover === 'object' && item.cover ? item.cover as Media : undefined
                    const reserved = item.reservations?.docs?.length ?? 0
                    const total = item.quantity ?? 0
                    const available = Math.max(total - reserved, 0)
                    return (
                        <div
                            key={item.id}
                            className="bg-white rounded shadow p-3 flex flex-col items-center mx-auto cursor-pointer hover:shadow-lg transition-shadow"
                            style={{ width: 200, minHeight: 340 }}
                            onClick={() => window.location.href = `/catalog/${item.id}`}
                        >
                            {cover?.url && (
                                <div className="relative w-full mb-2" style={{ aspectRatio: '1 / 1.414', width: 180, minHeight: 254 }}>
                                    <Image src={cover.url} alt={cover.alt ?? item.title} fill style={{ objectFit: 'cover', borderRadius: 7 }} />
                                </div>
                            )}
                            <h3
                                className="text-lg font-semibold mb-1 text-center leading-tight w-full truncate"
                                title={item.title}
                                style={{ maxWidth: 200 }}
                            >
                                {item.title}
                            </h3>
                            <span className="text-sm text-gray-600"><strong>{available} disponibles</strong> de {total}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default CatalogListClient 