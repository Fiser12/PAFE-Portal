'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, List, Newspaper, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useIdioma } from '@/components/IdiomaProvider'
import type { CodigoIdioma } from '@/core/localization'
import { nombreDelArea } from '@/modules/tablon/domain/areas'
import { cn } from '@/utilities/ui'
import { semanaCompleta, semanaDe, type Dia } from '../domain/agrupar'
import { colorDe } from '../domain/calendarios'
import { mezclar, porDias, type Entrada, type NoticiaDeAgenda } from '../domain/entradas'
import { diaCorto, diaLargo, hora } from '../domain/fechas'
import type { Ocurrencia } from '../domain/ocurrencias'

const ZONA = 'Europe/Madrid'
const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000

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
}

const rehidratar = (plana: OcurrenciaPlana): Ocurrencia => ({
  ...plana,
  inicio: new Date(plana.inicio),
  fin: new Date(plana.fin),
})

function Fila({
  entrada,
  nombres,
  todoElDia,
  compacta = false,
  conPin = false,
  etiquetaPin,
}: {
  entrada: Entrada
  nombres: Record<string, string>
  todoElDia: string
  compacta?: boolean
  conPin?: boolean
  etiquetaPin?: string
}) {
  const contenido =
    entrada.tipo === 'evento' ? (
      <>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {entrada.diaCompleto ? todoElDia : hora(entrada.fecha)}
        </span>
        <span className={cn('min-w-0 flex-1', compacta ? 'break-words' : 'truncate')}>
          {entrada.titulo}
        </span>
      </>
    ) : (
      <>
        {conPin ? (
          <Pin className="mt-0.5 h-3 w-3 shrink-0" aria-label={etiquetaPin} />
        ) : (
          <Newspaper className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1">
          <span className={cn('block font-medium', compacta ? 'break-words' : 'truncate')}>
            {entrada.titulo}
          </span>
          {!compacta && entrada.resumen && (
            <span className="block truncate text-xs text-muted-foreground">{entrada.resumen}</span>
          )}
        </span>
        {!compacta && (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {nombreDelArea(entrada.area)}
          </Badge>
        )}
      </>
    )

  const clases = cn(
    'flex items-baseline gap-2 border-l-2 pl-2',
    compacta ? 'py-0.5 text-xs' : 'py-1 text-sm',
  )
  const color =
    entrada.tipo === 'evento' ? colorDe(entrada.calendario) : 'hsl(var(--primary))'

  if (entrada.tipo === 'noticia') {
    return (
      <li>
        <Link
          href={entrada.enlace}
          className={cn(clases, 'rounded-r transition-colors hover:bg-accent/50')}
          style={{ borderLeftColor: color }}
        >
          {contenido}
        </Link>
      </li>
    )
  }

  return (
    <li
      className={clases}
      style={{ borderLeftColor: color }}
      title={nombres[entrada.calendario] ?? undefined}
    >
      {contenido}
    </li>
  )
}

/** Título de la sección con sus controles al lado, fuera de la tarjeta */
function Controles({
  vista,
  setVista,
  semana,
  setSemana,
  titulo,
  t,
}: {
  vista: 'agenda' | 'semana'
  setVista: (v: 'agenda' | 'semana') => void
  semana: Date
  setSemana: (d: Date) => void
  titulo: string
  t: Record<string, string>
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <h2 className="text-xl font-semibold sm:text-2xl">{titulo}</h2>

      <div className="flex gap-0.5 rounded-md border p-0.5">
        <Button
          variant={vista === 'agenda' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setVista('agenda')}
        >
          <List className="mr-1 h-4 w-4" />
          {t.calAgenda}
        </Button>
        <Button
          variant={vista === 'semana' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setVista('semana')}
        >
          <CalendarDays className="mr-1 h-4 w-4" />
          {t.calSemana}
        </Button>
      </div>

      {vista === 'semana' && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={t.calSemanaAnterior}
            onClick={() => setSemana(new Date(semana.getTime() - UNA_SEMANA))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSemana(semanaDe(new Date(), ZONA).desde)}>
            {t.calVolverAHoy}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t.calSemanaSiguiente}
            onClick={() => setSemana(new Date(semana.getTime() + UNA_SEMANA))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function Agenda({ ocurrencias, noticias, nombres, fallidos }: Props) {
  const { idioma, t } = useIdioma()
  const [vista, setVista] = useState<'agenda' | 'semana'>('agenda')
  const [semana, setSemana] = useState(() => semanaDe(new Date(), ZONA).desde)
  const hoyRef = useRef<HTMLDivElement>(null)

  const todas = useMemo(() => ocurrencias.map(rehidratar), [ocurrencias])
  const { fijadas, recientes, cronologia } = useMemo(
    () => mezclar(todas, noticias, new Date(), ZONA),
    [todas, noticias],
  )
  const destacadas = [...fijadas, ...recientes]
  const { dias } = useMemo(() => porDias(cronologia, new Date(), ZONA), [cronologia])

  const semanal: Dia[] = useMemo(() => semanaCompleta(todas, semana, ZONA), [todas, semana])

  // Al abrir, la vista arranca en el día de hoy y no en lo más antiguo
  useEffect(() => {
    if (vista === 'agenda') hoyRef.current?.scrollIntoView({ block: 'start' })
  }, [vista, dias.length])

  return (
    <section>
      <Controles
        vista={vista}
        setVista={setVista}
        semana={semana}
        setSemana={setSemana}
        titulo={t.inicioCalendario}
        t={t as unknown as Record<string, string>}
      />

      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          {fallidos.length > 0 && <p className="text-xs text-muted-foreground">{t.calFallidos}</p>}

          {vista === 'agenda' ? (
            <>
              {destacadas.length > 0 && (
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.calNovedades}
                  </p>
                  <ul className="max-h-28 overflow-y-auto">
                    {destacadas.map((entrada) => (
                      <Fila
                        key={entrada.id}
                        entrada={entrada}
                        nombres={nombres}
                        todoElDia={t.calTodoElDia}
                        conPin={entrada.tipo === 'noticia' && entrada.fijada}
                        etiquetaPin={t.tablonFijada}
                      />
                    ))}
                  </ul>
                </div>
              )}

              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {dias.map((dia) => (
                  <div
                    key={dia.dia.toISOString()}
                    ref={dia.hoy ? hoyRef : undefined}
                    className={cn(
                      dia.hoy && 'rounded-lg border-2 border-primary bg-primary/5 p-2 shadow-sm',
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
                        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                          {t.calHoy}
                        </span>
                      )}
                      {diaLargo(dia.dia, idioma as CodigoIdioma)}
                    </h3>
                    {dia.entradas.length === 0 ? (
                      <p className="py-1 pl-2 text-xs text-muted-foreground">{t.calSinNada}</p>
                    ) : (
                      <ul>
                        {dia.entradas.map((entrada) => (
                          <Fila
                            key={entrada.id}
                            entrada={entrada}
                            nombres={nombres}
                            todoElDia={t.calTodoElDia}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid gap-2 sm:grid-cols-7">
              {semanal.map(({ dia, ocurrencias: delDia }) => {
                const esHoy =
                  new Intl.DateTimeFormat('sv-SE', { timeZone: ZONA }).format(new Date()) ===
                  dia.toISOString().slice(0, 10)
                return (
                  <div
                    key={dia.toISOString()}
                    className={cn(
                      'flex max-h-44 min-h-20 flex-col rounded-md border p-1.5',
                      esHoy && 'border-2 border-primary bg-primary/5',
                    )}
                  >
                    <p
                      className={cn(
                        'mb-1 shrink-0 text-xs font-semibold first-letter:uppercase',
                        esHoy ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {diaCorto(dia, idioma as CodigoIdioma)}
                    </p>
                    <ul className="min-h-0 flex-1 overflow-y-auto">
                      {delDia.map((ocurrencia, i) => (
                        <Fila
                          key={`${ocurrencia.uid}-${i}`}
                          entrada={{
                            tipo: 'evento',
                            id: `${ocurrencia.uid}-${i}`,
                            fecha: ocurrencia.inicio,
                            titulo: ocurrencia.titulo,
                            diaCompleto: ocurrencia.diaCompleto,
                            calendario: ocurrencia.calendario,
                          }}
                          nombres={nombres}
                          todoElDia={t.calTodoElDia}
                          compacta
                        />
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
