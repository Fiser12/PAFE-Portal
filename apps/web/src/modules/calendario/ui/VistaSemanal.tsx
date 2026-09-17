'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ExternalLink, Newspaper, Pin } from 'lucide-react'
import type { CodigoIdioma } from '@/core/localization'
import { cn } from '@/utilities/ui'
import { colorDe } from '../domain/calendarios'
import type { DiaDeAgenda, Entrada } from '../domain/entradas'
import { hora, nombreDelDia, numeroDelDia } from '../domain/fechas'
import { colocar, minutosDelDia, rangoDe, sinHora, type RangoHorario } from '../domain/rejilla'
import { ALTO_VISTA } from './Agenda'

/** Alto de una hora en la rejilla, en píxeles */
const ALTO_HORA = 44
const ANCHO_HORAS = 52

/** Hueco para que la primera etiqueta de hora no se corte contra la cabecera */
const MARGEN_SUPERIOR = 8

/** Alto de la cabecera de días: la banda de lo que no tiene hora se pega debajo */
const ALTO_CABECERA = 54

/** La cabecera de días y la rejilla comparten esta retícula, así quedan a plomo */
const COLUMNAS = `${ANCHO_HORAS}px repeat(7, minmax(0, 1fr))`

interface Props {
  dias: DiaDeAgenda[]
  nombres: Record<string, string>
  idioma: CodigoIdioma
  etiquetaPin: string
}

function SinHora({ entrada, etiquetaPin }: { entrada: Entrada; etiquetaPin: string }) {
  if (entrada.tipo === 'noticia') {
    return (
      <Link
        href={entrada.enlace}
        title={entrada.titulo}
        className="flex items-center gap-1 rounded-md border-l-2 border-pafe-orange-500 bg-pafe-orange-500/15 px-1 py-0.5 text-[10px] leading-tight text-pafe-orange-800 transition-colors hover:bg-pafe-orange-500/25"
      >
        {entrada.fijada ? (
          <Pin className="h-2.5 w-2.5 shrink-0" aria-label={etiquetaPin} />
        ) : (
          <Newspaper className="h-2.5 w-2.5 shrink-0" />
        )}
        <span className="line-clamp-2">{entrada.titulo}</span>
      </Link>
    )
  }

  const color = colorDe(entrada.calendario)
  return (
    <span
      title={entrada.titulo}
      className="block rounded-md border-l-2 px-1 py-0.5 text-[10px] font-medium leading-tight"
      style={{ borderLeftColor: color, backgroundColor: `${color}1f`, color }}
    >
      <span className="line-clamp-2">{entrada.titulo}</span>
    </span>
  )
}

/** Dónde cae ahora mismo dentro del rango dibujado, o null si se sale de él */
const posicionDeAhora = (rango: RangoHorario, ahora: Date): number | null => {
  const minutos = minutosDelDia(ahora) - rango.primeraHora * 60
  const total = (rango.ultimaHora - rango.primeraHora) * 60
  if (minutos < 0 || minutos > total) return null
  return MARGEN_SUPERIOR + (minutos / 60) * ALTO_HORA
}

/** La línea de la hora actual, solo sobre la columna de hoy */
function LineaDeAhora({ dias, rango }: { dias: DiaDeAgenda[]; rango: RangoHorario }) {
  const [ahora, setAhora] = useState<Date | null>(null)

  // Arranca en el cliente: el servidor no sabe qué hora es donde mira quien lee
  useEffect(() => {
    setAhora(new Date())
    const reloj = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(reloj)
  }, [])

  const columna = dias.findIndex((dia) => dia.hoy)
  if (!ahora || columna === -1) return null

  const arriba = posicionDeAhora(rango, ahora)
  if (arriba === null) return null

  return (
    <div
      className="pointer-events-none absolute z-20 flex items-center"
      style={{
        top: arriba,
        left: `calc(${ANCHO_HORAS}px + ${columna} * ((100% - ${ANCHO_HORAS}px) / 7))`,
        width: `calc((100% - ${ANCHO_HORAS}px) / 7)`,
      }}
    >
      <span className="-ml-1 h-2 w-2 rounded-full bg-destructive" />
      <span className="h-px flex-1 bg-destructive" />
    </div>
  )
}

export function VistaSemanal({ dias, nombres, idioma, etiquetaPin }: Props) {
  const todas = dias.flatMap((dia) => dia.entradas)
  const rango = rangoDe(todas)
  const horas = Array.from(
    { length: rango.ultimaHora - rango.primeraHora },
    (_, i) => rango.primeraHora + i,
  )
  const altoTotal = horas.length * ALTO_HORA
  const bandaSuperior = dias.some((dia) => sinHora(dia.entradas).length > 0)

  return (
    <div className="overflow-auto" style={{ height: ALTO_VISTA }}>
      <div className="min-w-[680px]">
        {/* Cabecera de días, fija al desplazar */}
        <div
          className="sticky top-0 z-30 grid border-b bg-card"
          style={{ gridTemplateColumns: COLUMNAS }}
        >
          <div className="border-r" />
          {dias.map((dia) => (
            <div
              key={dia.dia.toISOString()}
              className={cn(
                'border-r px-1 py-1.5 text-center last:border-r-0',
                dia.hoy && 'bg-primary/10',
              )}
            >
              <div
                className={cn(
                  'text-[10px] font-medium uppercase tracking-wide',
                  dia.hoy ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {nombreDelDia(dia.dia, idioma)}
              </div>
              <span
                className={cn(
                  'mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm font-semibold leading-none',
                  dia.hoy ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {numeroDelDia(dia.dia)}
              </span>
            </div>
          ))}
        </div>

        {/* Lo que no tiene hora: noticias y jornadas completas */}
        {bandaSuperior && (
          <div
            className="sticky z-20 grid border-b bg-muted/30"
            style={{ gridTemplateColumns: COLUMNAS, top: ALTO_CABECERA }}
          >
            <div className="border-r" />
            {dias.map((dia) => (
              <div
                key={dia.dia.toISOString()}
                className={cn(
                  'min-w-0 space-y-0.5 border-r p-1 last:border-r-0',
                  dia.hoy && 'bg-primary/5',
                )}
              >
                {sinHora(dia.entradas).map((entrada) => (
                  <SinHora key={entrada.id} entrada={entrada} etiquetaPin={etiquetaPin} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Rejilla horaria */}
        <div
          className="relative grid"
          style={{ gridTemplateColumns: COLUMNAS, height: altoTotal + MARGEN_SUPERIOR }}
        >
          <div className="border-r" style={{ paddingTop: MARGEN_SUPERIOR }}>
            {horas.map((h) => (
              <div
                key={h}
                className="relative pr-2 text-right text-[10px] tabular-nums text-muted-foreground"
                style={{ height: ALTO_HORA }}
              >
                <span className="absolute -top-1.5 right-2">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {dias.map((dia) => {
            const bloques = colocar(dia.entradas, rango)
            return (
              <div
                key={dia.dia.toISOString()}
                className={cn(
                  'relative min-w-0 border-r last:border-r-0',
                  dia.hoy && 'bg-primary/5',
                )}
                style={{ paddingTop: MARGEN_SUPERIOR }}
              >
                {horas.map((h) => (
                  <div key={h} className="border-b border-border/60" style={{ height: ALTO_HORA }} />
                ))}

                {bloques.map(({ entrada, desde, alto, columna, columnas }) => {
                  const color = colorDe(entrada.calendario)
                  const altoEnPx = Math.max(20, (alto / 60) * ALTO_HORA - 2)
                  return (
                    <div
                      key={entrada.id}
                      title={`${hora(entrada.fecha)} · ${entrada.titulo}${
                        nombres[entrada.calendario] ? ` — ${nombres[entrada.calendario]}` : ''
                      }`}
                      className="absolute z-10 overflow-hidden rounded-md px-1 py-0.5 transition-opacity hover:opacity-85"
                      style={{
                        top: MARGEN_SUPERIOR + (desde / 60) * ALTO_HORA,
                        height: altoEnPx,
                        left: `calc(${(columna / columnas) * 100}% + 2px)`,
                        width: `calc(${100 / columnas}% - 4px)`,
                        backgroundColor: `${color}1f`,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <span
                        className="line-clamp-2 text-[10px] font-semibold leading-tight"
                        style={{ color }}
                      >
                        {entrada.titulo}
                      </span>
                      {altoEnPx > 32 && (
                        <span className="block text-[9px] leading-none opacity-75" style={{ color }}>
                          {hora(entrada.fecha)}
                        </span>
                      )}
                      {entrada.enlaces[0] && altoEnPx > 44 && (
                        <a
                          href={entrada.enlaces[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex"
                          style={{ color }}
                          aria-label={entrada.enlaces[0]}
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          <LineaDeAhora dias={dias} rango={rango} />
        </div>
      </div>
    </div>
  )
}
