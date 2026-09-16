'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useIdioma } from '@/components/IdiomaProvider'
import type { CodigoIdioma } from '@/core/localization'
import { cn } from '@/utilities/ui'
import { agruparPorDia, semanaCompleta, semanaDe, type Dia } from '../domain/agrupar'
import { diaCorto, diaLargo, hora } from '../domain/fechas'
import { colorDe } from '../domain/calendarios'
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
  nombres: Record<string, string>
  fallidos: string[]
}

const rehidratar = (plana: OcurrenciaPlana): Ocurrencia => ({
  ...plana,
  inicio: new Date(plana.inicio),
  fin: new Date(plana.fin),
})

const esHoy = (dia: Date) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: ZONA }).format(new Date()) ===
  dia.toISOString().slice(0, 10)

function Evento({
  ocurrencia,
  nombres,
  idioma,
  todoElDia,
  compacto = false,
}: {
  ocurrencia: Ocurrencia
  nombres: Record<string, string>
  idioma: CodigoIdioma
  todoElDia: string
  compacto?: boolean
}) {
  const color = colorDe(ocurrencia.calendario)

  return (
    <li
      className={cn(
        'flex gap-2 rounded-md border-l-4 bg-muted/40 px-2 py-1.5',
        compacto ? 'text-xs' : 'text-sm',
      )}
      style={{ borderLeftColor: color }}
    >
      <span className="shrink-0 font-mono text-muted-foreground">
        {ocurrencia.diaCompleto ? todoElDia : hora(ocurrencia.inicio)}
      </span>
      <span className="min-w-0">
        <span className="block break-words font-medium">{ocurrencia.titulo}</span>
        {!compacto && nombres[ocurrencia.calendario] && (
          <span className="text-xs text-muted-foreground">{nombres[ocurrencia.calendario]}</span>
        )}
      </span>
    </li>
  )
}

export function Calendario({ ocurrencias, nombres, fallidos }: Props) {
  const { idioma, t } = useIdioma()
  const [vista, setVista] = useState<'agenda' | 'semana'>('agenda')
  const [semana, setSemana] = useState(() => semanaDe(new Date(), ZONA).desde)

  const todas = useMemo(() => ocurrencias.map(rehidratar), [ocurrencias])

  const agenda: Dia[] = useMemo(() => {
    const ahora = Date.now()
    return agruparPorDia(
      todas.filter((o) => o.fin.getTime() >= ahora),
      ZONA,
    ).slice(0, 14)
  }, [todas])

  const dias: Dia[] = useMemo(
    () => semanaCompleta(todas, semana, ZONA),
    [todas, semana],
  )

  const mover = (semanas: number) => setSemana(new Date(semana.getTime() + semanas * UNA_SEMANA))

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-md border p-0.5">
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
                onClick={() => mover(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSemana(semanaDe(new Date(), ZONA).desde)}
              >
                {t.calVolverAHoy}
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={t.calSemanaSiguiente}
                onClick={() => mover(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {fallidos.length > 0 && (
          <p className="text-xs text-muted-foreground">{t.calFallidos}</p>
        )}

        {vista === 'agenda' ? (
          agenda.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">{t.calSinNada}</p>
          ) : (
            <div className="space-y-4">
              {agenda.map(({ dia, ocurrencias: delDia }) => (
                <div key={dia.toISOString()}>
                  <h3
                    className={cn(
                      'mb-1.5 text-sm font-semibold first-letter:uppercase',
                      esHoy(dia) && 'text-primary',
                    )}
                  >
                    {esHoy(dia) ? `${t.calHoy} · ` : ''}
                    {diaLargo(dia, idioma)}
                  </h3>
                  <ul className="space-y-1">
                    {delDia.map((ocurrencia, i) => (
                      <Evento
                        key={`${ocurrencia.uid}-${i}`}
                        ocurrencia={ocurrencia}
                        nombres={nombres}
                        idioma={idioma}
                        todoElDia={t.calTodoElDia}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid gap-2 sm:grid-cols-7">
            {dias.map(({ dia, ocurrencias: delDia }) => (
              <div
                key={dia.toISOString()}
                className={cn(
                  'min-h-24 rounded-md border p-1.5',
                  esHoy(dia) && 'border-primary bg-primary/5',
                )}
              >
                <p className="mb-1 text-xs font-semibold text-muted-foreground first-letter:uppercase">
                  {diaCorto(dia, idioma)}
                </p>
                <ul className="space-y-1">
                  {delDia.map((ocurrencia, i) => (
                    <Evento
                      key={`${ocurrencia.uid}-${i}`}
                      ocurrencia={ocurrencia}
                      nombres={nombres}
                      idioma={idioma}
                      todoElDia={t.calTodoElDia}
                      compacto
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
