import type { Ocurrencia } from './ocurrencias'

export interface Dia {
  /** Medianoche del día, en hora de Madrid llevada a UTC */
  dia: Date
  ocurrencias: Ocurrencia[]
}

const clave = (fecha: Date, zona: string): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(fecha)

/** Agrupa por el día en que caen, mirando la hora local y no la UTC */
export const agruparPorDia = (
  ocurrencias: Ocurrencia[],
  zona = 'Europe/Madrid',
): Dia[] => {
  const dias = new Map<string, Ocurrencia[]>()

  for (const ocurrencia of ocurrencias) {
    const dia = clave(ocurrencia.inicio, zona)
    const existentes = dias.get(dia)
    if (existentes) existentes.push(ocurrencia)
    else dias.set(dia, [ocurrencia])
  }

  return [...dias.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, ocurrenciasDelDia]) => ({
      dia: new Date(`${dia}T00:00:00Z`),
      ocurrencias: ocurrenciasDelDia.sort((a, b) => a.inicio.getTime() - b.inicio.getTime()),
    }))
}

const UN_DIA = 24 * 60 * 60 * 1000

/** El lunes de la semana en que cae una fecha, y el domingo siguiente */
export const semanaDe = (fecha: Date, zona = 'Europe/Madrid'): { desde: Date; hasta: Date } => {
  const local = new Date(`${clave(fecha, zona)}T00:00:00Z`)
  // getUTCDay: domingo es 0, así que se corre para que la semana empiece el lunes
  const desplazamiento = (local.getUTCDay() + 6) % 7
  const desde = new Date(local.getTime() - desplazamiento * UN_DIA)
  return { desde, hasta: new Date(desde.getTime() + 7 * UN_DIA - 1) }
}

/** Los siete días de la semana, incluidos los que no tienen nada */
export const semanaCompleta = (
  ocurrencias: Ocurrencia[],
  desde: Date,
  zona = 'Europe/Madrid',
): Dia[] => {
  const porDia = new Map(agruparPorDia(ocurrencias, zona).map((d) => [d.dia.getTime(), d]))

  return Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(desde.getTime() + indice * UN_DIA)
    return porDia.get(dia.getTime()) ?? { dia, ocurrencias: [] }
  })
}
