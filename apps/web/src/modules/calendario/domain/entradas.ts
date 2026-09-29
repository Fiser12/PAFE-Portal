import { enlacesDe, textoLlano } from './enlaces'
import type { Ocurrencia } from './ocurrencias'

/**
 * Lo que aparece en el calendario: solo actividades programadas. Las noticias
 * se quedan en el foro, que es donde se leen.
 */
export interface Entrada {
  id: string
  fecha: Date
  titulo: string
  fin: Date
  diaCompleto: boolean
  calendario: string
  descripcion: string
  enlaces: string[]
  /** Solo en lo que dura varios días: qué día es de cuántos, como en Google */
  tramo?: { dia: number; de: number }
}

const deOcurrencia = (ocurrencia: Ocurrencia, indice: number): Entrada => ({
  id: `evento-${ocurrencia.uid}-${indice}`,
  fecha: ocurrencia.inicio,
  fin: ocurrencia.fin,
  titulo: ocurrencia.titulo,
  diaCompleto: ocurrencia.diaCompleto,
  calendario: ocurrencia.calendario,
  descripcion: textoLlano(ocurrencia.descripcion),
  enlaces: enlacesDe(ocurrencia.descripcion),
})

export const aEntradas = (ocurrencias: Ocurrencia[]): Entrada[] =>
  ocurrencias.map(deOcurrencia).sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

const UN_DIA = 24 * 60 * 60 * 1000

const diaEn = (fecha: Date, zona: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(fecha)

const siguienteDia = (clave: string) =>
  new Date(new Date(`${clave}T00:00:00Z`).getTime() + UN_DIA).toISOString().slice(0, 10)

/**
 * Los días que toca un evento, como `YYYY-MM-DD`. Las jornadas completas
 * llegan con la fecha de pared en UTC y el fin exclusivo de iCalendar, así
 * que se cuentan en UTC; lo que tiene hora, en el día de Madrid.
 */
export const diasQueOcupa = (entrada: Entrada, zona = 'Europe/Madrid'): string[] => {
  const zonaDelDia = entrada.diaCompleto ? 'UTC' : zona
  const primero = diaEn(entrada.fecha, zonaDelDia)
  const ultimo =
    entrada.fin > entrada.fecha ? diaEn(new Date(entrada.fin.getTime() - 1), zonaDelDia) : primero

  const dias = [primero]
  while (dias.at(-1)! < ultimo) dias.push(siguienteDia(dias.at(-1)!))
  return dias
}

/** Si va en la rejilla horaria: tiene hora y empieza y acaba el mismo día */
export const tieneFranja = (entrada: Entrada, zona = 'Europe/Madrid'): boolean =>
  !entrada.diaCompleto && diasQueOcupa(entrada, zona).length === 1

/** La entrada tal como se ve en uno de sus días */
const enSuDia = (entrada: Entrada, dias: string[], clave: string): Entrada =>
  dias.length === 1
    ? entrada
    : {
        ...entrada,
        id: `${entrada.id}-${clave}`,
        tramo: { dia: dias.indexOf(clave) + 1, de: dias.length },
      }

const porClave = (entradas: Entrada[], zona: string): Map<string, Entrada[]> => {
  const agrupadas = new Map<string, Entrada[]>()
  for (const entrada of entradas) {
    const dias = diasQueOcupa(entrada, zona)
    for (const clave of dias) {
      const delDia = enSuDia(entrada, dias, clave)
      const existentes = agrupadas.get(clave)
      if (existentes) existentes.push(delDia)
      else agrupadas.set(clave, [delDia])
    }
  }
  return agrupadas
}

/** Primero lo que dura todo el día, luego por hora */
const ordenDelDia = (a: Entrada, b: Entrada) =>
  Number(tieneFranja(a)) - Number(tieneFranja(b)) || a.fecha.getTime() - b.fecha.getTime()

export interface DiaDeAgenda {
  dia: Date
  hoy: boolean
  entradas: Entrada[]
}

/**
 * Parte la cronología en días y marca el de hoy. Devuelve también el índice
 * del día de hoy, para poder llevar la vista hasta él sin buscarlo a mano.
 * Con `desde`, los días anteriores se quedan fuera aunque haya algo en curso.
 */
export const porDias = (
  entradas: Entrada[],
  ahora: Date,
  zona = 'Europe/Madrid',
  desde?: Date,
): { dias: DiaDeAgenda[]; indiceDeHoy: number } => {
  const claveDeHoy = diaEn(ahora, zona)
  const corte = desde ? diaEn(desde, zona) : ''
  const agrupadas = porClave(entradas, zona)

  // El día de hoy sale siempre, aunque no haya nada: es la referencia
  if (!agrupadas.has(claveDeHoy)) agrupadas.set(claveDeHoy, [])

  const dias = [...agrupadas.entries()]
    .filter(([clave]) => clave >= corte)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, delDia]) => ({
      dia: new Date(`${clave}T00:00:00Z`),
      hoy: clave === claveDeHoy,
      entradas: delDia.sort(ordenDelDia),
    }))

  return { dias, indiceDeHoy: dias.findIndex((d) => d.hoy) }
}

/** Los siete días de una semana con lo que cae en cada uno, vacíos incluidos */
export const sieteDias = (
  entradas: Entrada[],
  desde: Date,
  ahora: Date = new Date(),
  zona = 'Europe/Madrid',
): DiaDeAgenda[] => {
  const claveDeHoy = diaEn(ahora, zona)
  const agrupadas = porClave(entradas, zona)

  return Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(desde.getTime() + indice * UN_DIA)
    const clave = dia.toISOString().slice(0, 10)
    return {
      dia,
      hoy: clave === claveDeHoy,
      entradas: (agrupadas.get(clave) ?? []).sort(ordenDelDia),
    }
  })
}
