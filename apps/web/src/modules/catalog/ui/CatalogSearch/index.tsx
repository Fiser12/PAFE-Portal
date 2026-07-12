'use client'

import type { Taxonomy } from '@/payload-types'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/utilities/useDebounce'
import { searchCatalog } from '../../actions/searchCatalog'
import { CatalogResultCard, type CatalogResult } from './ResultCard'

interface Props {
  categories: Taxonomy[]
}

const COLLECTION_OPTIONS = [
  { value: 'all', label: 'Todo el catálogo' },
  { value: 'catalog-item', label: 'Reservables' },
  { value: 'files', label: 'Descargables' },
  { value: 'external-resources', label: 'Recursos externos' },
]

const EXTERNAL_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos los formatos' },
  { value: 'video', label: 'Vídeo' },
  { value: 'web_link', label: 'Enlace web' },
  { value: 'google-form', label: 'Google Form' },
  { value: 'google-doc', label: 'Google Doc' },
]

export function CatalogSearch({ categories }: Props) {
  const [query, setQuery] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [collectionType, setCollectionType] = useState('all')
  const [itemType, setItemType] = useState('all')

  const debouncedQuery = useDebounce(query, 300)
  const categoryIds = useMemo(() => selectedCategoryIds, [selectedCategoryIds])

  const { data, isLoading } = useSWR(
    ['catalog-search', debouncedQuery, categoryIds, collectionType, itemType],
    () =>
      searchCatalog({
        query: debouncedQuery,
        categoryIds,
        collectionType: collectionType === 'all' ? undefined : collectionType,
        itemType:
          collectionType === 'external-resources' && itemType !== 'all' ? itemType : undefined,
      }),
    { keepPreviousData: true },
  )

  const results = (data ?? []) as CatalogResult[]

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  return (
    <div className="container py-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-semibold sm:mb-6 sm:text-3xl">Catálogo</h1>

      {/* Filtros */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título…"
            className="pl-9"
            aria-label="Buscar"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            value={collectionType}
            onValueChange={(value) => {
              setCollectionType(value)
              setItemType('all')
            }}
          >
            <SelectTrigger className="w-full sm:w-52" aria-label="Tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {collectionType === 'external-resources' && (
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Formato">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                {EXTERNAL_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const active = selectedCategoryIds.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={active}
                >
                  <Badge
                    variant={active ? 'default' : 'outline'}
                    className={cn('cursor-pointer', !active && 'hover:bg-accent')}
                  >
                    {cat.name}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Resultados */}
      {isLoading && results.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : results.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          No se han encontrado materiales con estos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {results.map((result) => (
            <CatalogResultCard key={`${result.collectionType}-${result.id}`} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}
