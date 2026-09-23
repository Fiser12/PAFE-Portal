'use client'

import { useIdioma } from '@/components/IdiomaProvider'
import type { CodigoIdioma } from '@/core/localization'
import { fechaLarga } from '@/modules/calendario/domain/fechas'
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

const fecha = (iso: string | null | undefined, idioma: CodigoIdioma) =>
  iso ? fechaLarga(new Date(iso), idioma) : ''

const resumen = (noticia: Noticia): string => {
  const root = (noticia.body as { root?: { children?: unknown[] } } | null)?.root
  const parrafos = (root?.children ?? []) as { children?: { text?: string }[] }[]
  return parrafos
    .flatMap((p) => (p.children ?? []).map((t) => t.text ?? ''))
    .join(' ')
    .slice(0, 220)
}

export function Tablon() {
  const { idioma, t } = useIdioma()
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
        <h2 className="text-xl font-semibold sm:text-2xl">{t.tablon}</h2>
        <Button asChild size="sm" variant="outline">
          <Link href="/foro">{t.foroVer} →</Link>
        </Button>
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={area ? 'outline' : 'default'} onClick={() => setArea(undefined)}>
              {t.tablonTodas}
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
              {archivadas ? t.tablonVer : t.tablonArchivadas}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="py-6 text-sm text-muted-foreground">{t.tablonCargando}</p>
      ) : error ? (
        <p className="py-6 text-sm text-muted-foreground">
          {t.tablonErrorCargar}
        </p>
      ) : noticias.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">{t.tablonVacio}</p>
      ) : (
        <Card>
          <CardContent className="max-h-80 divide-y overflow-y-auto p-0">
            {noticias.map((noticia) => (
              <Link
                key={noticia.id}
                href={`/noticias/${noticia.id}`}
                className="block px-4 py-2.5 transition-colors hover:bg-accent/50"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {noticia.pinned && (
                    <Pin className="h-3 w-3 shrink-0 self-center" aria-label={t.tablonFijada} />
                  )}
                  <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{noticia.title}</h3>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {nombreDelArea(noticia.area)}
                  </Badge>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fecha(noticia.publishedAt, idioma)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{resumen(noticia)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

    </section>
  )
}
