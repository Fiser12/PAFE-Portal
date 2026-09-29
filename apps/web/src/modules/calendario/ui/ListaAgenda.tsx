'use client'

import { ExternalLink, Plus } from 'lucide-react'
import type { CodigoIdioma } from '@/core/localization'
import { rellenar, type Textos } from '@/core/textos'
import { cn } from '@/utilities/ui'
import { colorDe } from '../domain/calendarios'
import type { DiaDeAgenda, Entrada } from '../domain/entradas'
import { diaLargo, hora } from '../domain/fechas'

/** Donde se editan los calendarios mientras sigan viviendo en Google */
const NUEVO_EN_GOOGLE = 'https://calendar.google.com/calendar/r/eventedit'

interface Props {
  dias: DiaDeAgenda[]
  nombres: Record<string, string>
  idioma: CodigoIdioma
  t: Textos
  puedeEditar: boolean
}

function Fila({ entrada, nombres, t }: { entrada: Entrada; nombres: Record<string, string>; t: Textos }) {
  const sigue = Boolean(entrada.tramo && entrada.tramo.dia > 1)
  const cuando = entrada.diaCompleto || sigue ? t.calTodoElDia : hora(entrada.fecha)
  return (
    <li className="flex gap-2 py-1" title={nombres[entrada.calendario] ?? undefined}>
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: colorDe(entrada.calendario) }}
      />
      <span className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
        {cuando}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug">
          {entrada.titulo}
          {entrada.tramo && (
            <span className="ml-1 font-normal text-muted-foreground">
              ({rellenar(t.calTramo, { dia: String(entrada.tramo.dia), de: String(entrada.tramo.de) })})
            </span>
          )}
        </span>
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

export function ListaAgenda({ dias, nombres, idioma, t, puedeEditar }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {dias.map((dia) => (
          <section key={dia.dia.toISOString()}>
            <h3
              className={cn(
                'sticky top-0 z-10 flex items-center gap-2 bg-card py-1 text-xs font-semibold uppercase tracking-wide first-letter:uppercase',
                dia.hoy ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {dia.hoy && (
                <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {t.calHoy}
                </span>
              )}
              {diaLargo(dia.dia, idioma as CodigoIdioma)}
            </h3>
            {dia.entradas.length === 0 ? (
              <p className="py-1 pl-4 text-xs text-muted-foreground">{t.calSinNada}</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {dia.entradas.map((entrada) => (
                  <Fila key={entrada.id} entrada={entrada} nombres={nombres} t={t} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {puedeEditar && (
        <div className="flex justify-end pt-2">
          <a
            href={NUEVO_EN_GOOGLE}
            target="_blank"
            rel="noopener noreferrer"
            title={t.calAnadirEnGoogle}
            aria-label={t.calAnadirEnGoogle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted"
          >
            <Plus className="h-5 w-5" />
          </a>
        </div>
      )}
    </div>
  )
}
