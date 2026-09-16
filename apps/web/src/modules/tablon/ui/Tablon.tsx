'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Noticia } from '@/payload-types'
import { nombreDelArea } from '../domain/areas'
import { cargarTablon } from '../actions'

const fecha = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

const resumen = (noticia: Noticia): string => {
  const root = (noticia.body as { root?: { children?: unknown[] } } | null)?.root
  const parrafos = (root?.children ?? []) as { children?: { text?: string }[] }[]
  return parrafos
    .flatMap((p) => (p.children ?? []).map((t) => t.text ?? ''))
    .join(' ')
    .slice(0, 220)
}

export function Tablon() {
  const [area, setArea] = useState<string | undefined>()
  const [archivadas, setArchivadas] = useState(false)
  const { data, error, isLoading } = useSWR(['tablon', area, archivadas], () =>
    cargarTablon(area, archivadas),
  )

  const noticias = data?.noticias ?? []
  const areas = data?.areas ?? []

  if (data?.acceso === 'sin-permiso') return null

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold sm:text-3xl">Tablón</h2>
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={area ? 'outline' : 'default'} onClick={() => setArea(undefined)}>
              Todas
            </Button>
            {areas.map((opcion) => (
              <Button
                key={opcion.value}
                size="sm"
                variant={area === opcion.value ? 'default' : 'outline'}
                onClick={() => setArea(opcion.value)}
              >
                {opcion.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={archivadas ? 'secondary' : 'ghost'}
              onClick={() => setArchivadas((v) => !v)}
            >
              {archivadas ? 'Ver el tablón' : 'Archivadas'}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="py-6 text-sm text-muted-foreground">Cargando el tablón…</p>
      ) : error ? (
        <p className="py-6 text-sm text-muted-foreground">
          No se pudo cargar el tablón. Recarga la página para volver a intentarlo.
        </p>
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

    </section>
  )
}
