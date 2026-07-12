'use client'

import type { CatalogItem, Taxonomy } from '@/payload-types'
import { useMemo, useState } from 'react'
import { CatalogItemCard } from './CatalogItemCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CatalogListClientProps {
  catalogItems: CatalogItem[]
  categories: Taxonomy[]
}

const getCategoryId = (cat: number | Taxonomy) => (typeof cat === 'number' ? cat : cat.id)

export const CatalogList = ({ catalogItems, categories }: CatalogListClientProps) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return catalogItems
    return catalogItems.filter((item) =>
      item.categories.some((cat) => getCategoryId(cat) === selectedCategory),
    )
  }, [catalogItems, selectedCategory])

  return (
    <div className="container">
      {/* Cabecera con filtro */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold sm:text-3xl">Catálogo</h2>

        <Select
          value={selectedCategory ? String(selectedCategory) : 'all'}
          onValueChange={(value) => setSelectedCategory(value === 'all' ? null : Number(value))}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Categoría">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de materiales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((item) => (
          <CatalogItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
