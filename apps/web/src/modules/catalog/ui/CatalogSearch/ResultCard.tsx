'use client'

import type { Media } from '@/payload-types'
import { useRouter } from 'next/navigation'
import { Download, ExternalLink, BookMarked } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface CatalogResult {
  id: number | string
  title?: string | null
  collectionType?: string | null
  itemType?: string | null
  cover?: number | Media | null
  url?: string | null
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

  // La url viene copiada en el índice search; el fallback vía doc.value solo
  // funciona si el doc llegara poblado (el campo del plugin tiene maxDepth 0)
  const url = result.url ?? getDocUrl(result)
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
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-48 items-center justify-center bg-muted p-3">
        {cover?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.alt ?? result.title ?? ''}
            loading="lazy"
            className="max-h-40 w-auto max-w-full rounded object-contain"
          />
        ) : isReservable ? (
          <BookMarked className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.5} />
        ) : collectionType === 'files' ? (
          <Download className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.5} />
        ) : (
          <ExternalLink className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.5} />
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <Badge variant="outline" className="self-start">
          {typeLabel}
        </Badge>
        <h3 className="line-clamp-2 font-semibold leading-snug" title={result.title ?? ''}>
          {result.title}
        </h3>

        <div className="mt-auto pt-2">
          {isReservable ? (
            <Button className="w-full" onClick={handleOpen}>
              Ver ficha
            </Button>
          ) : (
            <Button className="w-full" onClick={handleOpen} disabled={!url}>
              {collectionType === 'files' ? (
                <Download className="mr-2 h-4 w-4" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {collectionType === 'files' ? 'Descargar' : 'Ver'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
