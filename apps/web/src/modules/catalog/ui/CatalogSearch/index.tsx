'use client'

import type { Taxonomy } from '@/payload-types'
import { useEffect, useMemo, useRef, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTextos } from '@/components/IdiomaProvider'
import type { Textos } from '@/core/textos'
import { useDebounce } from '@/utilities/useDebounce'
import { searchCatalog, type SearchCatalogResult } from '../../actions/searchCatalog'
import { CatalogResultCard, type CatalogResult } from './ResultCard'

const PAGE_SIZE = 24

interface Props {
  categories: Taxonomy[]
  /** Búsqueda inicial: la wiki enlaza de vuelta al catálogo con ?q=<título> */
  initialQuery?: string
}

const collectionOptions = (t: Textos) => [
  { value: 'all', label: t.catalogoTodo },
  { value: 'catalog-item', label: t.catalogoReservables },
  { value: 'files', label: t.catalogoDescargables },
  { value: 'external-resources', label: t.catalogoRecursosExternos },
]

// Cada colección filtra por su propio campo de tipo; los descargables no tienen.
const itemTypeFilters = (
  t: Textos,
): Record<string, { label: string; options: { value: string; label: string }[] }> => ({
  'catalog-item': {
    label: t.catalogoMaterial,
    options: [
      { value: 'all', label: t.catalogoTodosMateriales },
      { value: 'libro', label: t.catalogoLibros },
      { value: 'juego', label: t.catalogoJuegos },
      { value: 'programa', label: t.catalogoProgramasTecnicos },
    ],
  },
  'external-resources': {
    label: t.catalogoFormato,
    options: [
      { value: 'all', label: t.catalogoTodosFormatos },
      { value: 'video', label: t.catalogoVideo },
      { value: 'web_link', label: t.catalogoEnlaceWeb },
      { value: 'google-form', label: 'Google Form' },
      { value: 'google-doc', label: 'Google Doc' },
    ],
  },
})

// Facetas de la taxonomía (vienen en `payload.types` de cada término).
// Un selector por faceta; entre facetas el filtro se combina con AND.
const facets = (t: Textos): { key: string; label: string; allLabel: string }[] => [
  { key: 'tematica', label: t.catalogoTematica, allLabel: t.catalogoTodasTematicas },
  { key: 'edad', label: t.catalogoEdad, allLabel: t.catalogoTodasEdades },
  { key: 'destinatario', label: t.catalogoDestinatario, allLabel: t.catalogoTodosDestinatarios },
]

const facetOf = (cat: Taxonomy): string => cat.payload?.types?.[0] ?? 'tematica'

export function CatalogSearch({ categories, initialQuery = '' }: Props) {
  const t = useTextos()
  const [query, setQuery] = useState(initialQuery)
  const [facetSelection, setFacetSelection] = useState<Record<string, string>>({})
  const [collectionType, setCollectionType] = useState('all')
  const [itemType, setItemType] = useState('all')
  const itemTypeFilter = itemTypeFilters(t)[collectionType]

  const debouncedQuery = useDebounce(query, 300)

  // Términos agrupados por faceta (los que no declaran faceta van a Temática)
  const grouped = useMemo(() => {
    const groups: Record<string, Taxonomy[]> = {}
    for (const cat of categories) {
      const facet = facetOf(cat)
      groups[facet] = groups[facet] ?? []
      groups[facet].push(cat)
    }
    return groups
  }, [categories])

  // Un grupo por faceta seleccionada → AND entre facetas en el servidor
  const categoryGroups = useMemo(
    () =>
      Object.values(facetSelection)
        .filter((v) => v && v !== 'all')
        .map((v) => [v]),
    [facetSelection],
  )

  // Clave estable de los filtros: al cambiar, el scroll infinito vuelve a empezar
  const filtersKey = useMemo(
    () => JSON.stringify([debouncedQuery, categoryGroups, collectionType, itemType]),
    [debouncedQuery, categoryGroups, collectionType, itemType],
  )

  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite(
    (pageIndex: number, previous: SearchCatalogResult | null) => {
      if (previous && !previous.hasNextPage) return null
      return ['catalog-search', filtersKey, pageIndex + 1]
    },
    ([, , page]: [string, string, number]) =>
      searchCatalog({
        query: debouncedQuery,
        categoryGroups,
        collectionType: collectionType === 'all' ? undefined : collectionType,
        itemType: itemType === 'all' ? undefined : itemType,
        page,
        limit: PAGE_SIZE,
      }),
    { keepPreviousData: true, revalidateFirstPage: false },
  )

  // Al cambiar los filtros, volver a la primera página
  useEffect(() => {
    setSize(1)
  }, [filtersKey, setSize])

  const pages = data ?? []
  const results = pages.flatMap((p) => p.docs) as CatalogResult[]
  const totalDocs = pages.length > 0 ? pages[pages.length - 1]!.totalDocs : 0
  const hasMore = pages.length > 0 ? pages[pages.length - 1]!.hasNextPage : false

  // Sentinel: al entrar en pantalla carga la página siguiente
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isValidating) {
          setSize(size + 1)
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isValidating, size, setSize])

  return (
    <div className="container py-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-semibold sm:mb-6 sm:text-3xl">{t.catalogo}</h1>

      {/* Filtros */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.catalogoBuscarPorTitulo}
            className="pl-9"
            aria-label="Buscar"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Select
            value={collectionType}
            onValueChange={(value) => {
              setCollectionType(value)
              setItemType('all')
            }}
          >
            <SelectTrigger className="w-full sm:w-52" aria-label={t.catalogoTipo}>
              <SelectValue placeholder={t.catalogoTipo} />
            </SelectTrigger>
            <SelectContent>
              {collectionOptions(t).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {itemTypeFilter && (
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger className="w-full sm:w-48" aria-label={itemTypeFilter.label}>
                <SelectValue placeholder={itemTypeFilter.label} />
              </SelectTrigger>
              <SelectContent>
                {itemTypeFilter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {facets(t)
            .filter((facet) => (grouped[facet.key] ?? []).length > 0)
            .map((facet) => (
            <Select
              key={facet.key}
              value={facetSelection[facet.key] ?? 'all'}
              onValueChange={(value) =>
                setFacetSelection((prev) => ({ ...prev, [facet.key]: value }))
              }
            >
              <SelectTrigger className="w-full sm:w-56" aria-label={facet.label}>
                <SelectValue placeholder={facet.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{facet.allLabel}</SelectItem>
                {grouped[facet.key]!.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {isLoading && results.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : results.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          {t.catalogoSinResultados}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {totalDocs} {totalDocs === 1 ? t.catalogoMaterialUno : t.catalogoMaterialVarios}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {results.map((result) => (
              <CatalogResultCard key={`${result.collectionType}-${result.id}`} result={result} />
            ))}
          </div>
          {/* Sentinel del scroll infinito */}
          <div ref={sentinelRef} aria-hidden className="h-px" />
          {hasMore && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
