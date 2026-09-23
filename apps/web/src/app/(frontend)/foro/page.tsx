import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, MessageSquare, Pin, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isActiveUser } from '@/core/permissions'
import { rellenar, textosDe } from '@/core/textos'
import { fechaLarga } from '@/modules/calendario/domain/fechas'
import { nombreDelArea } from '@/modules/tablon/domain/areas'
import { temasDelForo } from '@/modules/tablon/services'
import { getIdioma } from '@/utilities/getIdioma'
import { getSessionUser } from '@/utilities/getSessionUser'
import { cn } from '@/utilities/ui'

export const metadata: Metadata = { title: 'Foro | PAFE', robots: { index: false, follow: false } }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const texto = (valor: string | string[] | undefined) => (typeof valor === 'string' ? valor : '')

export default async function ForoPage({ searchParams }: Props) {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) redirect('/login')

  const [params, idioma] = await Promise.all([searchParams, getIdioma()])
  const t = textosDe(idioma)
  const area = texto(params.area)
  const archivadas = texto(params.archivo) === '1'
  const busqueda = texto(params.q).trim().slice(0, 200)
  const resultado = await temasDelForo({
    payload,
    user,
    area,
    archivadas,
    busqueda,
    pagina: Number(texto(params.pagina) || 1),
    now: new Date(),
    locale: idioma,
  })

  const enlace = (cambios: { area?: string; archivo?: boolean; pagina?: number } = {}) => {
    const query = new URLSearchParams()
    const seleccion = cambios.area ?? area
    if (seleccion) query.set('area', seleccion)
    if (cambios.archivo ?? archivadas) query.set('archivo', '1')
    if (busqueda) query.set('q', busqueda)
    if (cambios.pagina && cambios.pagina > 1) query.set('pagina', String(cambios.pagina))
    return `/foro${query.size ? `?${query}` : ''}`
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:py-12">
      <header className="border-b pb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← {t.navInicio}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{t.navForo}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t.foroDescripcion}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t.foroAreas}
          </h2>
          <nav aria-label={t.foroAreas} className="flex flex-wrap gap-1 lg:flex-col">
            {[
              { value: '', label: t.tablonTodas },
              ...resultado.areas.map((value) => ({ value, label: nombreDelArea(value) })),
            ].map((opcion) => (
              <Link
                key={opcion.value}
                href={enlace({ area: opcion.value })}
                aria-current={area === opcion.value ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent',
                  area === opcion.value && 'bg-primary/10 font-semibold text-primary',
                )}
              >
                {opcion.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 space-y-5" aria-label={t.navForo}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label={t.tablonArchivadas} className="flex gap-1 rounded-lg border p-1">
              {[
                { archivo: false, label: t.foroActuales },
                { archivo: true, label: t.tablonArchivadas },
              ].map((opcion) => (
                <Button
                  key={opcion.label}
                  asChild
                  size="sm"
                  variant={archivadas === opcion.archivo ? 'secondary' : 'ghost'}
                >
                  <Link
                    href={enlace({ archivo: opcion.archivo })}
                    aria-current={archivadas === opcion.archivo ? 'page' : undefined}
                  >
                    {opcion.label}
                  </Link>
                </Button>
              ))}
            </nav>
            <form action="/foro" className="flex w-full gap-2 sm:w-auto" role="search">
              {area && <input type="hidden" name="area" value={area} />}
              {archivadas && <input type="hidden" name="archivo" value="1" />}
              <Input
                key={busqueda}
                type="search"
                name="q"
                defaultValue={busqueda}
                maxLength={200}
                placeholder={t.foroBuscar}
                aria-label={t.foroBuscar}
                className="min-w-0 sm:w-64"
              />
              <Button type="submit" variant="outline" size="icon" aria-label={t.buscar}>
                <Search aria-hidden="true" />
              </Button>
            </form>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold">{area ? nombreDelArea(area) : t.tablonTodas}</h2>
            <span className="text-sm tabular-nums text-muted-foreground">
              {resultado.totalDocs} {resultado.totalDocs === 1 ? t.foroTema : t.foroTemas}
            </span>
          </div>

          {resultado.docs.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-16 text-center">
              <MessageSquare
                className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">{t.foroVacio}</p>
            </div>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {resultado.docs.map((noticia) => (
                <li key={noticia.id}>
                  <Link
                    href={`/noticias/${noticia.id}`}
                    className="group flex items-start gap-4 p-4 transition-colors hover:bg-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:p-5"
                  >
                    <span
                      className={cn(
                        'mt-0.5 hidden rounded-lg p-2.5 sm:block',
                        noticia.pinned
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {noticia.pinned ? (
                        <Pin className="h-5 w-5" aria-label={t.tablonFijada} />
                      ) : (
                        <MessageSquare className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold leading-relaxed group-hover:text-primary">
                        {noticia.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{nombreDelArea(noticia.area)}</Badge>
                        {noticia.pinned && <span>{t.tablonFijada}</span>}
                        <time dateTime={noticia.publishedAt}>
                          {fechaLarga(new Date(noticia.publishedAt), idioma)}
                        </time>
                      </div>
                    </div>
                    <ArrowRight
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {resultado.totalPages > 1 && (
            <nav
              aria-label={t.foroPaginacion}
              className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"
            >
              {resultado.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={enlace({ pagina: resultado.page - 1 })}>
                    <ArrowLeft aria-hidden="true" />
                    {t.pagAnterior}
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {t.pagAnterior}
                </Button>
              )}
              <span className="text-sm tabular-nums text-muted-foreground">
                {rellenar(t.foroPagina, {
                  pagina: String(resultado.page),
                  total: String(resultado.totalPages),
                })}
              </span>
              {resultado.page < resultado.totalPages ? (
                <Button asChild variant="outline">
                  <Link href={enlace({ pagina: resultado.page + 1 })}>
                    {t.pagSiguiente}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {t.pagSiguiente}
                </Button>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
