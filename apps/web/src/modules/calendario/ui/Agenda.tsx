'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Rows3 } from 'lucide-react'
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

/** Alto de la rejilla semanal: la hora de hoy se ve sin desplazar la página */
export const ALTO_VISTA = 420

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

/**
 * El esquema del calendario de Google que había antes: el mes (o la semana) a
 * la izquierda y la agenda desde hoy a la derecha, cada calendario con su color.
 */
export function Agenda({ ocurrencias, nombres, fallidos, puedeEditar, onPeriodoChange }: Props) {
  const { idioma, t } = useIdioma()
  const [vista, setVista] = useState<'mes' | 'semana'>('mes')
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
  const cambiarA = (nueva: 'mes' | 'semana') => {
    setVista(nueva)
    mostrarPeriodo(nueva === 'mes' ? mes : semana)
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.inicioCalendario}</h2>

        <div className="flex gap-0.5 rounded-md border p-0.5">
          <Button
            variant={vista === 'mes' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => cambiarA('mes')}
          >
            <CalendarDays className="mr-1 h-4 w-4" />
            {t.calMes}
          </Button>
          <Button
            variant={vista === 'semana' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => cambiarA('semana')}
          >
            <Rows3 className="mr-1 h-4 w-4" />
            {t.calSemana}
          </Button>
        </div>

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
      </div>

      {fallidos.length > 0 && <p className="text-xs text-muted-foreground">{t.calFallidos}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-3 sm:p-4">
            {vista === 'mes' ? (
              <VistaMensual
                semanas={mensual}
                mes={mes}
                nombres={nombres}
                idioma={idioma as CodigoIdioma}
              />
            ) : (
              <VistaSemanal dias={semanal} nombres={nombres} idioma={idioma as CodigoIdioma} />
            )}
            <Leyenda nombres={nombres} titulo={t.calLeyenda} />
          </CardContent>
        </Card>

        {/* En escritorio la agenda mide lo que el mes y se desplaza por dentro */}
        <Card className="order-first lg:relative lg:order-none">
          <CardContent className="h-[420px] p-3 sm:p-4 lg:absolute lg:inset-0 lg:h-auto">
            <h3 className="mb-2 text-sm font-semibold">{t.calAgenda}</h3>
            <div className="h-[calc(100%-1.75rem)]">
              <ListaAgenda
                dias={agenda}
                nombres={nombres}
                idioma={idioma as CodigoIdioma}
                t={t}
                puedeEditar={puedeEditar}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
