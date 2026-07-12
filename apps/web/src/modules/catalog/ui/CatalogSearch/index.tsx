'use client'

import type { Taxonomy } from '@/payload-types'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Autocomplete,
  Box,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useDebounce } from '@/utilities/useDebounce'
import { searchCatalog } from '../../actions/searchCatalog'
import { CatalogResultCard, type CatalogResult } from './ResultCard'

interface Props {
  categories: Taxonomy[]
}

const COLLECTION_OPTIONS = [
  { value: '', label: 'Todo el catálogo' },
  { value: 'catalog-item', label: 'Reservables' },
  { value: 'files', label: 'Descargables' },
  { value: 'external-resources', label: 'Recursos externos' },
]

const EXTERNAL_TYPE_OPTIONS = [
  { value: '', label: 'Todos los formatos' },
  { value: 'video', label: 'Vídeo' },
  { value: 'web_link', label: 'Enlace web' },
  { value: 'google-form', label: 'Google Form' },
  { value: 'google-doc', label: 'Google Doc' },
]

export function CatalogSearch({ categories }: Props) {
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Taxonomy[]>([])
  const [collectionType, setCollectionType] = useState('')
  const [itemType, setItemType] = useState('')

  const debouncedQuery = useDebounce(query, 300)
  const categoryIds = useMemo(
    () => selectedCategories.map((c) => c.id),
    [selectedCategories],
  )

  const { data, isLoading } = useSWR(
    ['catalog-search', debouncedQuery, categoryIds, collectionType, itemType],
    () =>
      searchCatalog({
        query: debouncedQuery,
        categoryIds,
        collectionType: collectionType || undefined,
        itemType: collectionType === 'external-resources' ? itemType || undefined : undefined,
      }),
    { keepPreviousData: true },
  )

  const results = (data ?? []) as CatalogResult[]

  return (
    <Container maxWidth="lg" sx={{ py: 0 }}>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Catálogo
      </Typography>

      {/* Filtros */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 2fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        <TextField
          label="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          placeholder="Buscar por título…"
        />
        <Autocomplete
          multiple
          options={categories}
          getOptionLabel={(option) => option.name ?? ''}
          value={selectedCategories}
          onChange={(_e, value) => setSelectedCategories(value)}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...params} label="Categorías" />}
        />
        <FormControl fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={collectionType}
            label="Tipo"
            onChange={(e) => {
              setCollectionType(e.target.value)
              setItemType('')
            }}
          >
            {COLLECTION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {collectionType === 'external-resources' && (
          <FormControl fullWidth sx={{ gridColumn: { md: '3 / 4' } }}>
            <InputLabel>Formato</InputLabel>
            <Select
              value={itemType}
              label="Formato"
              onChange={(e) => setItemType(e.target.value)}
            >
              {EXTERNAL_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Resultados */}
      {isLoading && results.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : results.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
          No se han encontrado materiales con estos filtros.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {results.map((result) => (
            <CatalogResultCard key={`${result.collectionType}-${result.id}`} result={result} />
          ))}
        </Box>
      )}
    </Container>
  )
}
