import { enlacesDe, textoLlano } from './enlaces'
import type { Ocurrencia } from './ocurrencias'

/**
 * Lo que aparece en la agenda. El tablón y el calendario cuentan lo mismo
 * —qué pasa y cuándo—, así que se mezclan en una sola línea de tiempo en vez
 * de repartirse en dos bloques que hay que mirar por separado.
 */
export type Entrada =
  | {
      tipo: 'evento'
      id: string
      fecha: Date
      titulo: string
      fin: Date
      diaCompleto: boolean
      calendario: string
      descripcion: string
      enlaces: string[]
    }
  | {
      tipo: 'noticia'
      id: string
      fecha: Date
      titulo: string
      resumen: string
      area: string
      fijada: boolean
      enlace: string
    }

export interface NoticiaDeAgenda {
  id: number | string
  titulo: string
  resumen: string
  area: string
  fijada: boolean
  publicadaEn: string
}

const deOcurrencia = (ocurrencia: Ocurrencia, indice: number): Entrada => ({
  tipo: 'evento',
  id: `evento-${ocurrencia.uid}-${indice}`,
  fecha: ocurrencia.inicio,
  fin: ocurrencia.fin,
  titulo: ocurrencia.titulo,
  diaCompleto: ocurrencia.diaCompleto,
  calendario: ocurrencia.calendario,
  descripcion: textoLlano(ocurrencia.descripcion),
  enlaces: enlacesDe(ocurrencia.descripcion),
})

const deNoticia = (noticia: NoticiaDeAgenda): Entrada => ({
  tipo: 'noticia',
  id: `noticia-${noticia.id}`,
  fecha: new Date(noticia.publicadaEn),
  titulo: noticia.titulo,
  resumen: noticia.resumen,
  area: noticia.area,
  fijada: noticia.fijada,
  enlace: `/noticias/${noticia.id}`,
})

const inicioDelDia = (fecha: Date, zona: string): Date =>
  new Date(`${new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(fecha)}T00:00:00Z`)

const UN_DIA = 24 * 60 * 60 * 1000

/**
 * Días que la agenda mira hacia atrás. No es capricho: una noticia se publica
 * con la fecha del día en que se escribe, nunca con una futura, así que
 * cortando en hoy solo se vería la jornada en que se publicó. Con la semana
 * detrás, lo del tablón sigue ahí unos días y lo viejo no estorba.
 */
export const DIAS_ATRAS = 7

/**
 * Una sola línea de tiempo: lo del tablón y lo del calendario caen en su día.
 *
 * Lo fijado sale aparte y sin filtro de fecha: está fijado justamente para que
 * se vea siempre, así que va por encima de todo y no dentro de la agenda.
 */
export const mezclar = (
  ocurrencias: Ocurrencia[],
  noticias: NoticiaDeAgenda[],
  ahora: Date = new Date(),
  zona = 'Europe/Madrid',
  cortarPasado = true,
): { fijadas: Entrada[]; cronologia: Entrada[] } => {
  const corte = new Date(inicioDelDia(ahora, zona).getTime() - DIAS_ATRAS * UN_DIA)
  const deTablon = noticias.map(deNoticia)

  return {
    fijadas: deTablon
      .filter((n) => n.tipo === 'noticia' && n.fijada)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
    cronologia: [
      ...ocurrencias.filter((o) => !cortarPasado || o.inicio >= corte).map(deOcurrencia),
      ...deTablon.filter((n) => n.tipo === 'noticia' && !n.fijada && n.fecha >= corte),
    ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
  }
}

const diaEn = (fecha: Date, zona: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(fecha)

export interface DiaDeAgenda {
  dia: Date
  hoy: boolean
  entradas: Entrada[]
}

/**
 * Parte la cronología en días y marca el de hoy. Devuelve también el índice
 * del día de hoy, para poder llevar la vista hasta él sin buscarlo a mano.
 */
export const porDias = (
  entradas: Entrada[],
  ahora: Date,
  zona = 'Europe/Madrid',
): { dias: DiaDeAgenda[]; indiceDeHoy: number } => {
  const claveDeHoy = diaEn(ahora, zona)
  const agrupadas = new Map<string, Entrada[]>()

  for (const entrada of entradas) {
    const clave = diaEn(entrada.fecha, zona)
    const existentes = agrupadas.get(clave)
    if (existentes) existentes.push(entrada)
    else agrupadas.set(clave, [entrada])
  }

  // El día de hoy sale siempre, aunque no haya nada: es la referencia
  if (!agrupadas.has(claveDeHoy)) agrupadas.set(claveDeHoy, [])

  const dias = [...agrupadas.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, delDia]) => ({
      dia: new Date(`${clave}T00:00:00Z`),
      hoy: clave === claveDeHoy,
      entradas: delDia.sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
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

  return Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(desde.getTime() + indice * UN_DIA)
    const clave = dia.toISOString().slice(0, 10)
    return {
      dia,
      hoy: clave === claveDeHoy,
      entradas: entradas
        .filter((entrada) => diaEn(entrada.fecha, zona) === clave)
        .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
    }
  })
}
