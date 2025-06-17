'use client'

import { ReservationsTable } from '@/modules/catalog/ui/ReservationsTable'
import type { CatalogItem, Taxonomy } from '@/payload-types'
import { useMemo, useState } from 'react'
import { CatalogItemCard } from './CatalogItemCard'

interface CatalogListClientProps {
    catalogItems: CatalogItem[]
    categories: Taxonomy[]
}

const getCategoryId = (cat: number | Taxonomy) => typeof cat === 'number' ? cat : cat.id

export const CatalogList = ({ catalogItems, categories }: CatalogListClientProps) => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

    const filteredItems = useMemo(() => {
        if (!selectedCategory) return catalogItems
        return catalogItems.filter(item =>
            item.categories.some(cat => getCategoryId(cat) === selectedCategory)
        )
    }, [catalogItems, selectedCategory])

    return (
        <div className="px-4">
            <ReservationsTable />
            <h2 className="text-2xl font-bold mb-4 mt-4">Catálogo</h2>
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
                {filteredItems.map(item => (
                    <CatalogItemCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    )
}

