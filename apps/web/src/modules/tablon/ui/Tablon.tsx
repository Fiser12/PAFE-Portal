'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Noticia, Taxonomy } from '@/payload-types'
import { cargarTablon, guardarAreasSuscritas } from '../actions'

const fecha = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

const nombreDelArea = (area: Noticia['area']): string =>
  typeof area === 'object' && area !== null ? ((area as Taxonomy).name ?? '') : ''

const resumen = (noticia: Noticia): string => {
  const root = (noticia.body as { root?: { children?: unknown[] } } | null)?.root
  const parrafos = (root?.children ?? []) as { children?: { text?: string }[] }[]
  return parrafos
    .flatMap((p) => (p.children ?? []).map((t) => t.text ?? ''))
    .join(' ')
    .slice(0, 220)
}

export function Tablon() {
  const [areaId, setAreaId] = useState<number | undefined>()
  const { data, isLoading, mutate } = useSWR(['tablon', areaId], () => cargarTablon(areaId))
  const [suscritas, setSuscritas] = useState<number[]>([])

  useEffect(() => {
    if (data?.suscritas) setSuscritas(data.suscritas)
  }, [data?.suscritas])

  const alternarArea = async (id: number) => {
    const siguiente = suscritas.includes(id)
      ? suscritas.filter((a) => a !== id)
      : [...suscritas, id]
    setSuscritas(siguiente)
    await guardarAreasSuscritas(siguiente)
    void mutate()
  }

  const noticias = data?.noticias ?? []
  const areas = data?.areas ?? []

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold sm:text-3xl">Tablón</h2>
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={areaId ? 'outline' : 'default'}
              onClick={() => setAreaId(undefined)}
            >
              Todas
            </Button>
            {areas.map((area) => (
              <Button
                key={area.id}
                size="sm"
                variant={areaId === Number(area.id) ? 'default' : 'outline'}
                onClick={() => setAreaId(Number(area.id))}
              >
                {area.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="py-6 text-sm text-muted-foreground">Cargando el tablón…</p>
      ) : noticias.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Todavía no hay nada publicado aquí.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {noticias.map((noticia) => (
            <Card key={noticia.id}>
              <CardContent className="p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {noticia.pinned && <Pin className="h-3 w-3" aria-label="Fijada" />}
                  <Badge variant="outline">{nombreDelArea(noticia.area)}</Badge>
                  <span>{fecha(noticia.publishedAt)}</span>
                </div>
                <h3 className="font-semibold leading-snug">
                  <Link className="hover:underline" href={`/noticias/${noticia.id}`}>
                    {noticia.title}
                  </Link>
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {resumen(noticia)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {areas.length > 0 && (
        <div className="mt-4 rounded-md border p-4">
          <p className="mb-2 text-sm font-medium">Avísame de estas áreas</p>
          <div className="flex flex-wrap gap-2">
            {areas.map((area) => (
              <Button
                key={area.id}
                size="sm"
                variant={suscritas.includes(Number(area.id)) ? 'default' : 'outline'}
                onClick={() => alternarArea(Number(area.id))}
              >
                {area.name}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Recibirás un correo y un aviso en la campana cuando se publique algo nuevo.
          </p>
        </div>
      )}
    </section>
  )
}
