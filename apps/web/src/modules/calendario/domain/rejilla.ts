import type { Entrada } from './entradas'

export interface Bloque {
  entrada: Extract<Entrada, { tipo: 'evento' }>
  /** Minutos desde el comienzo del rango mostrado */
  desde: number
  /** Cuánto dura, en minutos, con un mínimo para que se pueda leer */
  alto: number
  /** Cuál de las columnas ocupa cuando varios eventos se pisan */
  columna: number
  columnas: number
}

export interface RangoHorario {
  primeraHora: number
  ultimaHora: number
}

const MINUTOS_MINIMOS = 30

const minutosEn = (fecha: Date, zona: string): number => {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: zona,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fecha)
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0)
  return valor('hour') * 60 + valor('minute')
}

/**
 * Las horas que hay que dibujar. Se ajusta a lo que hay, con un mínimo
 * razonable: una semana vacía no debe enseñar la madrugada entera.
 */
export const rangoDe = (
  entradas: Entrada[],
  zona = 'Europe/Madrid',
  minimo: RangoHorario = { primeraHora: 8, ultimaHora: 20 },
): RangoHorario => {
  const conHora = entradas.filter((e): e is Extract<Entrada, { tipo: 'evento' }> =>
    Boolean(e.tipo === 'evento' && !e.diaCompleto),
  )
  if (conHora.length === 0) return minimo

  const inicios = conHora.map((e) => Math.floor(minutosEn(e.fecha, zona) / 60))
  const finales = conHora.map((e) => Math.ceil(minutosEn(e.fin, zona) / 60))

  return {
    primeraHora: Math.max(0, Math.min(minimo.primeraHora, ...inicios)),
    ultimaHora: Math.min(24, Math.max(minimo.ultimaHora, ...finales)),
  }
}

const sePisan = (a: Bloque, b: Bloque) =>
  a.desde < b.desde + b.alto && b.desde < a.desde + a.alto

/**
 * Coloca los eventos de un día en la rejilla: dónde empieza cada uno, cuánto
 * ocupa y, si varios se pisan, cuántas columnas hay que repartir para que se
 * vean todos.
 */
export const colocar = (
  entradas: Entrada[],
  rango: RangoHorario,
  zona = 'Europe/Madrid',
): Bloque[] => {
  const arranque = rango.primeraHora * 60

  const bloques: Bloque[] = entradas
    .filter((e): e is Extract<Entrada, { tipo: 'evento' }> =>
      Boolean(e.tipo === 'evento' && !e.diaCompleto),
    )
    .map((entrada) => {
      const desde = minutosEn(entrada.fecha, zona) - arranque
      const hasta = minutosEn(entrada.fin, zona) - arranque
      return {
        entrada,
        desde,
        alto: Math.max(MINUTOS_MINIMOS, hasta > desde ? hasta - desde : MINUTOS_MINIMOS),
        columna: 0,
        columnas: 1,
      }
    })
    .sort((a, b) => a.desde - b.desde || b.alto - a.alto)

  // Cada grupo de eventos encadenados por solapes reparte su propio ancho
  let grupo: Bloque[] = []
  const cerrarGrupo = () => {
    const columnas = Math.max(...grupo.map((b) => b.columna + 1), 1)
    for (const bloque of grupo) bloque.columnas = columnas
    grupo = []
  }

  for (const bloque of bloques) {
    if (grupo.length > 0 && !grupo.some((otro) => sePisan(otro, bloque))) cerrarGrupo()

    const ocupadas = new Set(grupo.filter((otro) => sePisan(otro, bloque)).map((o) => o.columna))
    let libre = 0
    while (ocupadas.has(libre)) libre++
    bloque.columna = libre
    grupo.push(bloque)
  }
  if (grupo.length > 0) cerrarGrupo()

  return bloques
}

/** Lo que no ocupa una franja horaria: días completos y noticias */
export const sinHora = (entradas: Entrada[]): Entrada[] =>
  entradas.filter((e) => e.tipo === 'noticia' || e.diaCompleto)
