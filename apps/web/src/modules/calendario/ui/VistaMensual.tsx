'use client'

import type { CodigoIdioma } from '@/core/localization'
import { cn } from '@/utilities/ui'
import { colorDe, textoSobre } from '../domain/calendarios'
import type { Entrada } from '../domain/entradas'
import { hora, nombreDelDia } from '../domain/fechas'
import type { Barra, SemanaDelMes } from '../domain/mes'

interface Props {
  semanas: SemanaDelMes[]
  mes: Date
  nombres: Record<string, string>
  idioma: CodigoIdioma
}

const titulo = (entrada: Entrada, nombres: Record<string, string>) =>
  [entrada.titulo, nombres[entrada.calendario]].filter(Boolean).join(' — ')

function BarraDelMes({ barra, nombres }: { barra: Barra; nombres: Record<string, string> }) {
  const color = colorDe(barra.entrada.calendario)
  const conHora = !barra.entrada.diaCompleto && !barra.empiezaAntes
  return (
    <div
      title={titulo(barra.entrada, nombres)}
      className={cn(
        'z-10 mx-0.5 truncate px-1.5 text-[11px] font-semibold leading-5',
        !barra.empiezaAntes && 'rounded-l-md',
        !barra.acabaDespues && 'rounded-r-md',
        barra.empiezaAntes && '-ml-px',
        barra.acabaDespues && '-mr-px',
      )}
      style={{
        gridColumn: `${barra.desde + 1} / ${barra.hasta + 2}`,
        gridRow: barra.carril + 2,
        backgroundColor: color,
        color: textoSobre(color),
      }}
    >
      {conHora && <span className="mr-1 font-normal">{hora(barra.entrada.fecha)}</span>}
      {barra.entrada.titulo}
    </div>
  )
}

function EventoDelDia({ entrada, nombres }: { entrada: Entrada; nombres: Record<string, string> }) {
  return (
    <li
      title={titulo(entrada, nombres)}
      className="flex min-w-0 items-center gap-1 rounded px-1 text-[11px] leading-5 hover:bg-muted"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: colorDe(entrada.calendario) }}
      />
      <span className="shrink-0 tabular-nums text-muted-foreground">{hora(entrada.fecha)}</span>
      <span className="truncate font-medium">{entrada.titulo}</span>
    </li>
  )
}

export function VistaMensual({ semanas, mes, nombres, idioma }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] overflow-hidden rounded-lg border">
        <div className="grid grid-cols-7 border-b bg-muted/60">
          {semanas[0]?.dias.map(({ dia }) => (
            <div
              key={dia.toISOString()}
              className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {nombreDelDia(dia, idioma)}
            </div>
          ))}
        </div>

        {semanas.map((semana) => (
          <div
            key={semana.dias[0]?.dia.toISOString()}
            className="relative border-b last:border-b-0"
          >
            {/* Las casillas, detrás: bordes, días de otro mes y el de hoy */}
            <div className="absolute inset-0 grid grid-cols-7" aria-hidden>
              {semana.dias.map(({ dia, hoy }) => (
                <div
                  key={dia.toISOString()}
                  className={cn(
                    'border-r last:border-r-0',
                    dia.getUTCMonth() !== mes.getUTCMonth() && 'bg-muted/40',
                    hoy && 'bg-primary/5',
                  )}
                />
              ))}
            </div>

            <div
              className="relative grid min-h-24 grid-cols-7 content-start gap-y-0.5 pb-1"
              style={{ gridTemplateRows: `auto repeat(${semana.carriles}, 1.25rem) auto` }}
            >
              {semana.dias.map(({ dia, hoy }, columna) => (
                <time
                  key={dia.toISOString()}
                  dateTime={dia.toISOString().slice(0, 10)}
                  className="flex justify-center pt-1"
                  style={{ gridColumn: columna + 1, gridRow: 1 }}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold',
                      hoy && 'bg-primary text-primary-foreground',
                      !hoy && dia.getUTCMonth() !== mes.getUTCMonth() && 'text-muted-foreground',
                    )}
                  >
                    {dia.getUTCDate()}
                  </span>
                </time>
              ))}

              {semana.barras.map((barra) => (
                <BarraDelMes key={barra.entrada.id} barra={barra} nombres={nombres} />
              ))}

              {semana.dias.map(({ dia, entradas }, columna) => (
                <ul
                  key={`lista-${dia.toISOString()}`}
                  className="min-w-0 space-y-px px-0.5"
                  style={{ gridColumn: columna + 1, gridRow: semana.carriles + 2 }}
                >
                  {entradas.map((entrada) => (
                    <EventoDelDia key={entrada.id} entrada={entrada} nombres={nombres} />
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
