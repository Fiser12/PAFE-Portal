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
      diaCompleto: boolean
      calendario: string
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
  titulo: ocurrencia.titulo,
  diaCompleto: ocurrencia.diaCompleto,
  calendario: ocurrencia.calendario,
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

/**
 * Reparte lo que hay en dos sitios.
 *
 * La cronología es una agenda: va de hoy en adelante, porque un evento que ya
 * pasó no le sirve a nadie. Lo del tablón que se publicó antes de hoy no se
 * tira, se sube arriba como novedades: son noticias, y su valor es que se vean,
 * no la fecha en que cayeron.
 */
export const mezclar = (
  ocurrencias: Ocurrencia[],
  noticias: NoticiaDeAgenda[],
  ahora: Date = new Date(),
  zona = 'Europe/Madrid',
): { fijadas: Entrada[]; recientes: Entrada[]; cronologia: Entrada[] } => {
  const corte = inicioDelDia(ahora, zona)
  const porFechaDesc = (a: Entrada, b: Entrada) => b.fecha.getTime() - a.fecha.getTime()

  const noFijadas = noticias.filter((n) => !n.fijada).map(deNoticia)

  return {
    fijadas: noticias.filter((n) => n.fijada).map(deNoticia).sort(porFechaDesc),
    recientes: noFijadas.filter((n) => n.fecha < corte).sort(porFechaDesc),
    cronologia: [
      ...ocurrencias.filter((o) => o.inicio >= corte).map(deOcurrencia),
      ...noFijadas.filter((n) => n.fecha >= corte),
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
