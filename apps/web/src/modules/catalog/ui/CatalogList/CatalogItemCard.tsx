'use client'

import type { CatalogItem, Media } from '@/payload-types'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  item: CatalogItem
}

export function CatalogItemCard({ item }: Props) {
  const cover = typeof item.cover === 'object' && item.cover ? (item.cover as Media) : undefined
  const reserved = item.reservations?.docs?.length ?? 0
  const total = item.quantity ?? 0
  const available = Math.max(total - reserved, 0)

  return (
    <Link href={`/catalog/${item.id}`} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0">
        {cover?.url && (
          <div className="flex justify-center bg-muted p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.url}
              alt={cover.alt ?? item.title}
              title={cover.alt ?? item.title}
              loading="lazy"
              className="h-56 w-auto max-w-full rounded object-contain sm:h-64"
            />
          </div>
        )}

        <CardContent className="flex flex-1 flex-col gap-3 p-4">
          <h3
            className="line-clamp-2 text-center font-semibold leading-snug"
            title={item.title}
          >
            {item.title}
          </h3>

          <div className="mt-auto flex justify-center">
            <Badge variant={available > 0 ? 'success' : 'error'}>
              {available} disponibles de {total}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
