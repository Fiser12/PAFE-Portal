'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  ExternalLink,
  List,
  Newspaper,
  Pin,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useIdioma } from '@/components/IdiomaProvider'
import type { CodigoIdioma } from '@/core/localization'
import { nombreDelArea } from '@/modules/tablon/domain/areas'
import { cn } from '@/utilities/ui'
import { diasDelMes } from '../domain/mes'
import { semanaDe } from '../domain/agrupar'
import { colorDe } from '../domain/calendarios'
import { mezclar, porDias, sieteDias, type Entrada, type NoticiaDeAgenda } from '../domain/entradas'
import { diaLargo, hora, mesYAnio, nombreDelDia } from '../domain/fechas'
import type { Ocurrencia } from '../domain/ocurrencias'
import { VistaSemanal } from './VistaSemanal'

const ZONA = 'Europe/Madrid'
const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000

/** Las dos vistas miden lo mismo: cambiar de pestaña no debe mover la página */
export const ALTO_VISTA = 420

/** Lo que viaja del servidor al navegador: las fechas van como texto */
export interface OcurrenciaPlana extends Omit<Ocurrencia, 'inicio' | 'fin'> {
  inicio: string
  fin: string
}

interface Props {
  ocurrencias: OcurrenciaPlana[]
  noticias: NoticiaDeAgenda[]
  nombres: Record<string, string>
  fallidos: string[]
  onPeriodoChange?: (periodo: string) => void
}

const rehidratar = (plana: OcurrenciaPlana): Ocurrencia => ({
  ...plana,
  inicio: new Date(plana.inicio),
  fin: new Date(plana.fin),
})

const inicioDelDia = (fecha: Date) =>
  new Date(`${new Intl.DateTimeFormat('sv-SE', { timeZone: ZONA }).format(fecha)}T00:00:00Z`)

/** Una noticia del tablón: se distingue del calendario y se puede abrir */
function Noticia({
  entrada,
  compacta,
  etiquetaPin,
}: {
  entrada: Extract<Entrada, { tipo: 'noticia' }>
  compacta?: boolean
  etiquetaPin: string
}) {
  return (
    <li>
      <Link
        href={entrada.enlace}
        className={cn(
          'group flex gap-2 rounded-md border-l-4 border-pafe-orange-500 bg-pafe-orange-500/10 px-2 transition-colors hover:bg-pafe-orange-500/20',
          compacta ? 'py-1' : 'py-1.5',
        )}
      >
        {entrada.fijada ? (
          <Pin className="mt-0.5 h-3 w-3 shrink-0 text-pafe-orange-700" aria-label={etiquetaPin} />
        ) : (
          <Newspaper className="mt-0.5 h-3 w-3 shrink-0 text-pafe-orange-700" />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block font-medium underline-offset-2 group-hover:underline',
              compacta ? 'line-clamp-3 text-xs leading-tight' : 'truncate text-sm',
            )}
            title={entrada.titulo}
          >
            {entrada.titulo}
          </span>
          {!compacta && entrada.resumen && (
            <span className="block truncate text-xs text-muted-foreground">{entrada.resumen}</span>
          )}
        </span>
        {!compacta && (
          <Badge variant="secondary" className="shrink-0 self-start text-[10px]">
            {nombreDelArea(entrada.area)}
          </Badge>
        )}
      </Link>
    </li>
  )
}

/** Un evento del calendario. Si trae enlaces en su descripción, se ofrecen */
function Evento({
  entrada,
  nombres,
  todoElDia,
  compacta,
}: {
  entrada: Extract<Entrada, { tipo: 'evento' }>
  nombres: Record<string, string>
  todoElDia: string
  compacta?: boolean
}) {
  if (compacta) {
    return (
      <li
        className="rounded-md border-l-2 bg-background/60 px-1.5 py-1"
        style={{ borderLeftColor: colorDe(entrada.calendario) }}
        title={`${entrada.titulo}${entrada.descripcion ? ` — ${entrada.descripcion}` : ''}`}
      >
        <span className="block font-mono text-[10px] leading-none text-muted-foreground">
          {entrada.diaCompleto ? todoElDia : hora(entrada.fecha)}
        </span>
        <span className="mt-0.5 line-clamp-3 block text-xs leading-tight">{entrada.titulo}</span>
        {entrada.enlaces[0] && (
          <a
            href={entrada.enlaces[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            {new URL(entrada.enlaces[0]).hostname.replace(/^www\./, '')}
          </a>
        )}
      </li>
    )
  }

  return (
    <li
      className="flex gap-2 border-l-2 py-1 pl-2"
      style={{ borderLeftColor: colorDe(entrada.calendario) }}
      title={nombres[entrada.calendario] ?? undefined}
    >
      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        {entrada.diaCompleto ? todoElDia : hora(entrada.fecha)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{entrada.titulo}</span>
        {entrada.enlaces.length > 0 && (
          <span className="flex flex-wrap gap-2">
            {entrada.enlaces.slice(0, 2).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="max-w-40 truncate">{new URL(url).hostname}</span>
              </a>
            ))}
          </span>
        )}
      </span>
    </li>
  )
}

function Fila(props: {
  entrada: Entrada
  nombres: Record<string, string>
  todoElDia: string
  etiquetaPin: string
  compacta?: boolean
}) {
  const { entrada, ...resto } = props
  return entrada.tipo === 'noticia' ? (
    <Noticia entrada={entrada} compacta={resto.compacta} etiquetaPin={resto.etiquetaPin} />
  ) : (
    <Evento
      entrada={entrada}
      nombres={resto.nombres}
      todoElDia={resto.todoElDia}
      compacta={resto.compacta}
    />
  )
}

export function Agenda({ ocurrencias, noticias, nombres, fallidos, onPeriodoChange }: Props) {
  const { idioma, t } = useIdioma()
  const [vista, setVista] = useState<'agenda' | 'semana' | 'mes'>('agenda')
  const [semana, setSemana] = useState(() => semanaDe(new Date(), ZONA).desde)
  const [mes, setMes] = useState(() => inicioDelDia(new Date()))
  const hoyRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const todas = useMemo(() => ocurrencias.map(rehidratar), [ocurrencias])
  const { fijadas, cronologia } = useMemo(
    () => mezclar(todas, noticias, new Date(), ZONA, false),
    [todas, noticias],
  )
  const { dias } = useMemo(
    () =>
      porDias(
        cronologia.filter((entrada) => entrada.fecha.getTime() >= Date.now() - UNA_SEMANA),
        new Date(),
        ZONA,
      ),
    [cronologia],
  )
  const semanal = useMemo(
    () => sieteDias(cronologia, semana, new Date(), ZONA),
    [cronologia, semana],
  )
  const mensual = useMemo(() => diasDelMes(cronologia, mes), [cronologia, mes])
  const hoy = useMemo(() => inicioDelDia(new Date()), [])
  const [hoyALaVista, setHoyALaVista] = useState(true)

  const irAHoy = () => hoyRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })

  // La vista arranca en el día de hoy y no en lo más antiguo
  useEffect(() => {
    if (vista === 'agenda') hoyRef.current?.scrollIntoView({ block: 'start' })
  }, [vista, dias.length])

  // El botón de volver solo aparece cuando hoy se ha ido de la pantalla
  useEffect(() => {
    const marca = hoyRef.current
    const caja = scrollRef.current
    if (vista !== 'agenda' || !marca || !caja) return

    const vigilante = new IntersectionObserver(
      ([entrada]) => setHoyALaVista(Boolean(entrada?.isIntersecting)),
      { root: caja, threshold: 0.1 },
    )
    vigilante.observe(marca)
    return () => vigilante.disconnect()
  }, [vista, dias.length])

  const mostrarPeriodo = (fecha: Date) => onPeriodoChange?.(`${fecha.toISOString().slice(0, 7)}-01`)
  const mover = (pasos: number) => {
    const fecha =
      vista === 'mes'
        ? new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + pasos, 1))
        : new Date(semana.getTime() + pasos * UNA_SEMANA)
    if (vista === 'mes') setMes(fecha)
    else setSemana(fecha)
    mostrarPeriodo(fecha)
  }
  const volverAHoy = () => {
    const fecha = inicioDelDia(new Date())
    setMes(fecha)
    setSemana(semanaDe(new Date(), ZONA).desde)
    mostrarPeriodo(fecha)
  }

  return (
    <div className="space-y-6">
      {fijadas.length > 0 && (
        <section className="space-y-2">
          <ul className="space-y-1">
            {fijadas.map((entrada) => (
              <Fila
                key={entrada.id}
                entrada={entrada}
                nombres={nombres}
                todoElDia={t.calTodoElDia}
                etiquetaPin={t.tablonFijada}
              />
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.inicioCalendario}</h2>

          <div className="flex gap-0.5 rounded-md border p-0.5">
            <Button
              variant={vista === 'agenda' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setVista('agenda')
                mostrarPeriodo(inicioDelDia(new Date()))
              }}
            >
              <List className="mr-1 h-4 w-4" />
              {t.calAgenda}
            </Button>
            <Button
              variant={vista === 'semana' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setVista('semana')
                mostrarPeriodo(semana)
              }}
            >
              <CalendarDays className="mr-1 h-4 w-4" />
              {t.calSemana}
            </Button>
            <Button
              variant={vista === 'mes' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setVista('mes')
                mostrarPeriodo(mes)
              }}
            >
              <CalendarDays className="mr-1 h-4 w-4" />
              {t.calMes}
            </Button>
          </div>

          {vista !== 'agenda' && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label={vista === 'mes' ? t.calMesAnterior : t.calSemanaAnterior}
                onClick={() => mover(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={volverAHoy}>
                {t.calVolverAHoy}
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={vista === 'mes' ? t.calMesSiguiente : t.calSemanaSiguiente}
                onClick={() => mover(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="space-y-3 p-3 sm:p-4">
            {fallidos.length > 0 && (
              <p className="text-xs text-muted-foreground">{t.calFallidos}</p>
            )}

            {vista === 'agenda' ? (
              <div className="relative">
                {!hoyALaVista && (
                  <Button
                    size="sm"
                    onClick={irAHoy}
                    className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 shadow-lg"
                  >
                    <CornerDownLeft className="mr-1 h-3.5 w-3.5" />
                    {t.calVolverAHoy}
                  </Button>
                )}
                <div
                  ref={scrollRef}
                  className="space-y-3 overflow-y-auto pr-1"
                  style={{ height: ALTO_VISTA }}
                >
                  {dias.map((dia) => (
                    <div
                      key={dia.dia.toISOString()}
                      ref={dia.hoy ? hoyRef : undefined}
                      className={cn(
                        dia.hoy && 'rounded-lg border-2 border-primary bg-primary/5 p-2 shadow-sm',
                        dia.dia < hoy && 'opacity-60',
                      )}
                    >
                      <h3
                        className={cn(
                          'flex items-center gap-2 py-1 first-letter:uppercase',
                          dia.hoy
                            ? 'text-sm font-bold text-primary'
                            : 'sticky top-0 z-10 bg-card text-xs font-semibold text-muted-foreground',
                        )}
                      >
                        {dia.hoy && (
                          <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                            {t.calHoy}
                          </span>
                        )}
                        {diaLargo(dia.dia, idioma as CodigoIdioma)}
                      </h3>
                      {dia.entradas.length === 0 ? (
                        <p className="py-1 pl-2 text-xs text-muted-foreground">{t.calSinNada}</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {dia.entradas.map((entrada) => (
                            <Fila
                              key={entrada.id}
                              entrada={entrada}
                              nombres={nombres}
                              todoElDia={t.calTodoElDia}
                              etiquetaPin={t.tablonFijada}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : vista === 'mes' ? (
              <div className="space-y-3">
                <h3 className="text-center font-semibold capitalize" aria-live="polite">
                  {mesYAnio(mes, idioma)}
                </h3>
                <div className="overflow-x-auto">
                  <div className="grid min-w-[700px] grid-cols-7 overflow-hidden rounded-lg border">
                    {mensual.slice(0, 7).map(({ dia }) => (
                      <div
                        key={dia.toISOString()}
                        className="bg-muted p-2 text-center text-xs font-semibold"
                      >
                        {nombreDelDia(dia, idioma)}
                      </div>
                    ))}
                    {mensual.map(({ dia, hoy: esHoy, entradas }) => (
                      <div
                        key={dia.toISOString()}
                        className={cn(
                          'min-h-28 border-r border-t p-1.5',
                          dia.getUTCMonth() !== mes.getUTCMonth() &&
                            'bg-muted/40 text-muted-foreground',
                          esHoy && 'bg-primary/10 ring-2 ring-inset ring-primary',
                        )}
                      >
                        <time
                          dateTime={dia.toISOString().slice(0, 10)}
                          className="mb-2 block text-sm font-semibold"
                        >
                          {dia.getUTCDate()}
                        </time>
                        <ul className="space-y-1">
                          {entradas.map((entrada) => (
                            <Fila
                              key={entrada.id}
                              entrada={entrada}
                              nombres={nombres}
                              todoElDia={t.calTodoElDia}
                              etiquetaPin={t.tablonFijada}
                              compacta
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <VistaSemanal
                dias={semanal}
                nombres={nombres}
                idioma={idioma as CodigoIdioma}
                etiquetaPin={t.tablonFijada}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
