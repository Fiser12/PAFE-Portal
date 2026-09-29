'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useIdioma } from '@/components/IdiomaProvider'
import type { CodigoIdioma } from '@/core/localization'
import { semanaDe } from '../domain/agrupar'
import { CALENDARIOS } from '../domain/calendarios'
import { aEntradas, porDias, sieteDias } from '../domain/entradas'
import { mesYAnio } from '../domain/fechas'
import { semanasDelMes } from '../domain/mes'
import type { Ocurrencia } from '../domain/ocurrencias'
import { ListaAgenda } from './ListaAgenda'
import { VistaMensual } from './VistaMensual'
import { VistaSemanal } from './VistaSemanal'

const ZONA = 'Europe/Madrid'
const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000

/** Donde se editan los calendarios mientras sigan viviendo en Google */
const NUEVO_EN_GOOGLE = 'https://calendar.google.com/calendar/r/eventedit'

type Vista = 'agenda' | 'semana' | 'mes'

/** Lo que viaja del servidor al navegador: las fechas van como texto */
export interface OcurrenciaPlana extends Omit<Ocurrencia, 'inicio' | 'fin'> {
  inicio: string
  fin: string
}

interface Props {
  ocurrencias: OcurrenciaPlana[]
  nombres: Record<string, string>
  fallidos: string[]
  puedeEditar: boolean
  onPeriodoChange?: (periodo: string) => void
}

const rehidratar = (plana: OcurrenciaPlana): Ocurrencia => ({
  ...plana,
  inicio: new Date(plana.inicio),
  fin: new Date(plana.fin),
})

const inicioDelDia = (fecha: Date) =>
  new Date(`${new Intl.DateTimeFormat('sv-SE', { timeZone: ZONA }).format(fecha)}T00:00:00Z`)

/** Qué color es cada calendario: sin esto, los colores no dicen nada */
function Leyenda({ nombres, titulo }: { nombres: Record<string, string>; titulo: string }) {
  const conNombre = CALENDARIOS.filter((cal) => nombres[cal.id])
  if (conNombre.length === 0) return null
  return (
    <ul aria-label={titulo} className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {conNombre.map((cal) => (
        <li key={cal.id} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cal.color }} />
          {nombres[cal.id]}
        </li>
      ))}
    </ul>
  )
}

export function Agenda({ ocurrencias, nombres, fallidos, puedeEditar, onPeriodoChange }: Props) {
  const { idioma, t } = useIdioma()
  const [vista, setVista] = useState<Vista>('agenda')
  const [semana, setSemana] = useState(() => semanaDe(new Date(), ZONA).desde)
  const [mes, setMes] = useState(() => inicioDelDia(new Date()))

  const entradas = useMemo(() => aEntradas(ocurrencias.map(rehidratar)), [ocurrencias])
  const agenda = useMemo(
    () => porDias(entradas, new Date(), ZONA, inicioDelDia(new Date())).dias,
    [entradas],
  )
  const semanal = useMemo(() => sieteDias(entradas, semana, new Date(), ZONA), [entradas, semana])
  const mensual = useMemo(() => semanasDelMes(entradas, mes, new Date(), ZONA), [entradas, mes])

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
  const cambiarA = (nueva: Vista) => {
    setVista(nueva)
    mostrarPeriodo(nueva === 'mes' ? mes : nueva === 'semana' ? semana : inicioDelDia(new Date()))
  }

  const pestanas = [
    { vista: 'agenda', etiqueta: t.calAgenda, Icono: List },
    { vista: 'semana', etiqueta: t.calSemana, Icono: Rows3 },
    { vista: 'mes', etiqueta: t.calMes, Icono: CalendarDays },
  ] as const

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.inicioCalendario}</h2>

        <div className="flex gap-0.5 rounded-md border p-0.5" role="tablist">
          {pestanas.map(({ vista: valor, etiqueta, Icono }) => (
            <Button
              key={valor}
              role="tab"
              aria-selected={vista === valor}
              variant={vista === valor ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => cambiarA(valor)}
            >
              <Icono className="mr-1 h-4 w-4" />
              {etiqueta}
            </Button>
          ))}
        </div>

        {vista !== 'agenda' && (
          <>
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
            <span className="text-base font-semibold capitalize" aria-live="polite">
              {mesYAnio(vista === 'mes' ? mes : semana, idioma)}
            </span>
          </>
        )}
      </div>

      {fallidos.length > 0 && <p className="text-xs text-muted-foreground">{t.calFallidos}</p>}

      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          {vista === 'agenda' ? (
            <ListaAgenda dias={agenda} nombres={nombres} idioma={idioma as CodigoIdioma} t={t} />
          ) : vista === 'semana' ? (
            <VistaSemanal dias={semanal} nombres={nombres} idioma={idioma as CodigoIdioma} />
          ) : (
            <VistaMensual
              semanas={mensual}
              mes={mes}
              nombres={nombres}
              idioma={idioma as CodigoIdioma}
            />
          )}

          <div className="flex items-end justify-between gap-3">
            <Leyenda nombres={nombres} titulo={t.calLeyenda} />
            {puedeEditar && (
              <a
                href={NUEVO_EN_GOOGLE}
                target="_blank"
                rel="noopener noreferrer"
                title={t.calAnadirEnGoogle}
                aria-label={t.calAnadirEnGoogle}
                className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted"
              >
                <Plus className="h-5 w-5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
