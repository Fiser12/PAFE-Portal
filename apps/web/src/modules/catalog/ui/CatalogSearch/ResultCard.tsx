'use client'

import type { Media } from '@/payload-types'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardMedia, Typography, Chip, Box, Button } from '@mui/material'
import { Download, ExternalLink, BookMarked } from 'lucide-react'

export interface CatalogResult {
  id: number | string
  title?: string | null
  collectionType?: string | null
  itemType?: string | null
  cover?: number | Media | null
  doc?: { relationTo?: string; value?: unknown } | null
}

const COLLECTION_LABEL: Record<string, string> = {
  'catalog-item': 'Reservable',
  files: 'Descargable',
  'external-resources': 'Recurso externo',
}

const ITEM_TYPE_LABEL: Record<string, string> = {
  libro: 'Libro',
  juego: 'Juego',
  programa: 'Programa',
  video: 'Vídeo',
  web_link: 'Enlace web',
  'google-form': 'Google Form',
  'google-doc': 'Google Doc',
}

const getDocUrl = (result: CatalogResult): string | null => {
  const value = result.doc?.value as { url?: string | null } | undefined
  return value?.url ?? null
}

export function CatalogResultCard({ result }: { result: CatalogResult }) {
  const router = useRouter()
  const cover =
    typeof result.cover === 'object' && result.cover ? (result.cover as Media) : undefined
  const collectionType = result.collectionType ?? result.doc?.relationTo ?? ''
  const typeLabel =
    (result.itemType && ITEM_TYPE_LABEL[result.itemType]) ||
    COLLECTION_LABEL[collectionType] ||
    'Material'

  const url = getDocUrl(result)
  const isReservable = collectionType === 'catalog-item'

  const docValue = result.doc?.value
  const docId =
    typeof docValue === 'object' && docValue
      ? (docValue as { id?: number | string }).id
      : (docValue as number | string | undefined)

  const handleOpen = () => {
    if (isReservable && docId != null) {
      router.push(`/catalog/${docId}`)
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
          backgroundColor: 'action.hover',
        }}
      >
        {cover?.url ? (
          <CardMedia
            component="img"
            sx={{ maxHeight: 180, width: 'auto', maxWidth: '100%', objectFit: 'contain', borderRadius: 1 }}
            image={cover.url}
            alt={cover.alt ?? result.title ?? ''}
          />
        ) : isReservable ? (
          <BookMarked size={48} strokeWidth={1.5} opacity={0.4} />
        ) : collectionType === 'files' ? (
          <Download size={48} strokeWidth={1.5} opacity={0.4} />
        ) : (
          <ExternalLink size={48} strokeWidth={1.5} opacity={0.4} />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Chip label={typeLabel} size="small" variant="outlined" sx={{ alignSelf: 'flex-start', mb: 1 }} />
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.3,
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          title={result.title ?? ''}
        >
          {result.title}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          {isReservable ? (
            <Button fullWidth variant="contained" onClick={handleOpen} sx={{ textTransform: 'none' }}>
              Ver ficha
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={handleOpen}
              disabled={!url}
              startIcon={collectionType === 'files' ? <Download size={16} /> : <ExternalLink size={16} />}
              sx={{ textTransform: 'none' }}
            >
              {collectionType === 'files' ? 'Descargar' : 'Ver'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
