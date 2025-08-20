'use client'

import type { CatalogItem, Taxonomy } from '@/payload-types'
import { useMemo, useState } from 'react'
import { CatalogItemCard } from './CatalogItemCard'
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container
} from '@mui/material'

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
        <Container maxWidth="lg" sx={{ py: 0 }}>
            {/* Header with Filter */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                    Catálogo
                </Typography>
                
                <Box sx={{ minWidth: 200 }}>
                    <FormControl fullWidth size="medium">
                        <InputLabel>Categoría</InputLabel>
                        <Select
                            value={selectedCategory ?? ''}
                            label="Categoría"
                            onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="">Todas las categorías</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    {cat.singular_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Books Grid */}
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)'
                },
                gap: 3,
                justifyContent: 'center',
                justifyItems: 'center'
            }}>
                {filteredItems.map(item => (
                    <Box key={item.id} sx={{ width: '100%', maxWidth: 280 }}>
                        <CatalogItemCard item={item} />
                    </Box>
                ))}
            </Box>
        </Container>
    )
}

