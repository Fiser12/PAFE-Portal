'use client'

import Link from 'next/link'
import { ExternalLink, Newspaper, Pin } from 'lucide-react'
import type { CodigoIdioma } from '@/core/localization'
import { cn } from '@/utilities/ui'
import { colorDe } from '../domain/calendarios'
import type { DiaDeAgenda, Entrada } from '../domain/entradas'
import { diaCorto, hora } from '../domain/fechas'
import { colocar, rangoDe, sinHora } from '../domain/rejilla'
import { ALTO_VISTA } from './Agenda'

/** Alto de una hora en la rejilla, en píxeles */
const ALTO_HORA = 38
const ANCHO_HORAS = 44

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
        className="flex items-center gap-1 rounded-md border-l-2 border-pafe-orange-500 bg-pafe-orange-500/15 px-1 py-0.5 text-[10px] leading-tight hover:bg-pafe-orange-500/25"
      >
        {entrada.fijada ? (
          <Pin className="h-2.5 w-2.5 shrink-0 text-pafe-orange-700" aria-label={etiquetaPin} />
        ) : (
          <Newspaper className="h-2.5 w-2.5 shrink-0 text-pafe-orange-700" />
        )}
        <span className="line-clamp-2">{entrada.titulo}</span>
      </Link>
    )
  }

  return (
    <span
      title={entrada.titulo}
      className="block rounded-md border-l-2 bg-background px-1 py-0.5 text-[10px] leading-tight"
      style={{ borderLeftColor: colorDe(entrada.calendario) }}
    >
      <span className="line-clamp-2">{entrada.titulo}</span>
    </span>
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
      <div className="min-w-[640px]">
        {/* Cabecera de días, fija al desplazar */}
        <div
          className="sticky top-0 z-20 flex border-b bg-card"
          style={{ paddingLeft: ANCHO_HORAS }}
        >
          {dias.map((dia) => (
            <div
              key={dia.dia.toISOString()}
              className={cn(
                'flex-1 border-l px-1 py-1 text-center text-xs font-semibold first-letter:uppercase',
                dia.hoy ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {diaCorto(dia.dia, idioma)}
            </div>
          ))}
        </div>

        {/* Lo que no tiene hora: noticias y jornadas completas */}
        {bandaSuperior && (
          <div
            className="sticky z-10 flex border-b bg-muted/30"
            style={{ paddingLeft: ANCHO_HORAS, top: 26 }}
          >
            {dias.map((dia) => (
              <div
                key={dia.dia.toISOString()}
                className={cn('flex-1 space-y-0.5 border-l p-1', dia.hoy && 'bg-primary/5')}
              >
                {sinHora(dia.entradas).map((entrada) => (
                  <SinHora key={entrada.id} entrada={entrada} etiquetaPin={etiquetaPin} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Rejilla horaria */}
        <div className="relative flex" style={{ height: altoTotal }}>
          <div className="shrink-0" style={{ width: ANCHO_HORAS }}>
            {horas.map((h) => (
              <div
                key={h}
                className="relative text-[10px] tabular-nums text-muted-foreground"
                style={{ height: ALTO_HORA }}
              >
                <span className="absolute -top-1.5 right-1">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {dias.map((dia) => {
            const bloques = colocar(dia.entradas, rango)
            return (
              <div
                key={dia.dia.toISOString()}
                className={cn('relative flex-1 border-l', dia.hoy && 'bg-primary/5')}
              >
                {horas.map((h) => (
                  <div key={h} className="border-b border-dashed" style={{ height: ALTO_HORA }} />
                ))}

                {bloques.map(({ entrada, desde, alto, columna, columnas }) => (
                  <div
                    key={entrada.id}
                    title={`${hora(entrada.fecha)} · ${entrada.titulo}${
                      nombres[entrada.calendario] ? ` — ${nombres[entrada.calendario]}` : ''
                    }`}
                    className="absolute overflow-hidden rounded-md border-l-2 bg-background/95 px-1 py-0.5 shadow-sm"
                    style={{
                      top: (desde / 60) * ALTO_HORA,
                      height: Math.max(18, (alto / 60) * ALTO_HORA - 2),
                      left: `calc(${(columna / columnas) * 100}% + 2px)`,
                      width: `calc(${100 / columnas}% - 4px)`,
                      borderLeftColor: colorDe(entrada.calendario),
                    }}
                  >
                    <span className="block text-[9px] leading-none text-muted-foreground">
                      {hora(entrada.fecha)}
                    </span>
                    <span className="line-clamp-2 text-[10px] font-medium leading-tight">
                      {entrada.titulo}
                    </span>
                    {entrada.enlaces[0] && (
                      <a
                        href={entrada.enlaces[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex text-primary"
                        aria-label={entrada.enlaces[0]}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
