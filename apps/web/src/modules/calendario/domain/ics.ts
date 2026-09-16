export interface EventoIcs {
  uid: string
  titulo: string
  descripcion?: string
  lugar?: string
  inicio: Date
  fin: Date
  diaCompleto: boolean
  cancelado: boolean
  /** Regla de repetición en crudo, tal y como la escribe el calendario */
  rrule?: string
  /** Días concretos que la serie se salta */
  excepciones: Date[]
  /** Si esto es una instancia retocada, a qué ocurrencia de la serie sustituye */
  recurrenciaDe?: Date
  calendario: string
  /**
   * La hora tal y como se escribe en el calendario, metida en un Date de UTC.
   * Las repeticiones se calculan sobre esto: una reunión de las 10:00 sigue
   * siendo a las 10:00 aunque por el medio cambie la hora.
   */
  inicioPared: Date
  excepcionesPared: Date[]
  recurrenciaDePared?: Date
  zona: string
}

export interface CalendarioIcs {
  id: string
  nombre: string
  eventos: EventoIcs[]
}

interface Linea {
  nombre: string
  parametros: Record<string, string>
  valor: string
}

/**
 * El formato parte las líneas largas y continúa la siguiente con un espacio o
 * tabulador. Hay que rehacerlas antes de mirar nada.
 */
const desplegarLineas = (texto: string): string[] => {
  const lineas: string[] = []
  for (const cruda of texto.replace(/\r\n/g, '\n').split('\n')) {
    if ((cruda.startsWith(' ') || cruda.startsWith('\t')) && lineas.length > 0) {
      lineas[lineas.length - 1] += cruda.slice(1)
    } else if (cruda !== '') {
      lineas.push(cruda)
    }
  }
  return lineas
}

const desescapar = (valor: string): string =>
  valor
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\;/g, ';')
    .replace(/\\\\/g, '\\')

const partirLinea = (linea: string): Linea | null => {
  const corte = linea.indexOf(':')
  if (corte === -1) return null

  const izquierda = linea.slice(0, corte)
  const valor = linea.slice(corte + 1)
  const [nombre = '', ...trozos] = izquierda.split(';')

  const parametros: Record<string, string> = {}
  for (const trozo of trozos) {
    const igual = trozo.indexOf('=')
    if (igual !== -1) parametros[trozo.slice(0, igual).toUpperCase()] = trozo.slice(igual + 1)
  }

  return { nombre: nombre.toUpperCase(), parametros, valor }
}

/**
 * Cuánto se separa una zona horaria de UTC en un instante dado. Se calcula con
 * Intl para no arrastrar una tabla de husos: así el cambio de hora sale bien
 * sin depender de ninguna librería.
 */
const desfaseEnMinutos = (fecha: Date, zona: string): number => {
  const formato = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const partes = Object.fromEntries(
    formato.formatToParts(fecha).map(({ type, value }) => [type, value]),
  )
  const comoUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    Number(partes.hour === '24' ? '0' : partes.hour),
    Number(partes.minute),
    Number(partes.second),
  )
  return (comoUtc - fecha.getTime()) / 60000
}

/** Una hora de pared en una zona horaria, convertida al instante que le toca */
const instanteDeHoraLocal = (partes: number[], zona: string): Date => {
  const [a = 1970, m = 1, d = 1, h = 0, min = 0, s = 0] = partes
  const supuesto = new Date(Date.UTC(a, m - 1, d, h, min, s))
  // Dos pasadas: la primera corrige el grueso, la segunda el salto de DST
  const primera = new Date(supuesto.getTime() - desfaseEnMinutos(supuesto, zona) * 60000)
  return new Date(supuesto.getTime() - desfaseEnMinutos(primera, zona) * 60000)
}

const numeros = (valor: string): number[] => [
  Number(valor.slice(0, 4)),
  Number(valor.slice(4, 6)),
  Number(valor.slice(6, 8)),
  Number(valor.slice(9, 11) || 0),
  Number(valor.slice(11, 13) || 0),
  Number(valor.slice(13, 15) || 0),
]

export const ZONA_POR_DEFECTO = 'Europe/Madrid'

/** La hora de pared convertida a la zona que toca, metida en un Date de UTC */
export const aHoraPared = (fecha: Date, zona: string): Date =>
  new Date(fecha.getTime() + desfaseEnMinutos(fecha, zona) * 60000)

export const deHoraPared = (pared: Date, zona: string): Date =>
  instanteDeHoraLocal(
    [
      pared.getUTCFullYear(),
      pared.getUTCMonth() + 1,
      pared.getUTCDate(),
      pared.getUTCHours(),
      pared.getUTCMinutes(),
      pared.getUTCSeconds(),
    ],
    zona,
  )

export const leerFecha = (
  valor: string,
  parametros: Record<string, string>,
): { fecha: Date; pared: Date; diaCompleto: boolean; zona: string } => {
  const [a = 1970, m = 1, d = 1, h = 0, min = 0, s = 0] = numeros(valor)
  const partes = [a, m, d, h, min, s]
  const zona = parametros.TZID || ZONA_POR_DEFECTO

  if (parametros.VALUE === 'DATE' || valor.length === 8) {
    const fecha = new Date(Date.UTC(a, m - 1, d))
    return { fecha, pared: fecha, diaCompleto: true, zona }
  }

  const pared = new Date(Date.UTC(a, m - 1, d, h, min, s))

  if (valor.endsWith('Z')) {
    return { fecha: pared, pared: aHoraPared(pared, ZONA_POR_DEFECTO), diaCompleto: false, zona: ZONA_POR_DEFECTO }
  }

  return { fecha: instanteDeHoraLocal(partes, zona), pared, diaCompleto: false, zona }
}

/**
 * Lee un calendario en formato iCalendar. Solo mira los bloques VEVENT: los
 * VTIMEZONE traen sus propias reglas de repetición (los cambios de hora) y
 * colarlas produciría eventos que no existen.
 */
export const leerCalendario = (texto: string, id: string): CalendarioIcs => {
  const lineas = desplegarLineas(texto)
  const eventos: EventoIcs[] = []
  let nombre = id
  let dentroDeEvento = false
  let profundidadAjena = 0
  let actual: Partial<EventoIcs> & { excepciones: Date[]; excepcionesPared: Date[] } = {
    excepciones: [],
    excepcionesPared: [],
  }

  for (const linea of lineas) {
    const partida = partirLinea(linea)
    if (!partida) continue
    const { nombre: clave, parametros, valor } = partida

    if (clave === 'BEGIN') {
      if (valor === 'VEVENT') {
        dentroDeEvento = true
        actual = { excepciones: [], excepcionesPared: [], cancelado: false, diaCompleto: false }
      } else if (!dentroDeEvento && valor !== 'VCALENDAR') {
        profundidadAjena++
      }
      continue
    }

    if (clave === 'END') {
      if (valor === 'VEVENT') {
        dentroDeEvento = false
        if (actual.uid && actual.inicio) {
          eventos.push({
            uid: actual.uid,
            titulo: actual.titulo ?? '',
            descripcion: actual.descripcion,
            lugar: actual.lugar,
            inicio: actual.inicio,
            fin: actual.fin ?? actual.inicio,
            diaCompleto: actual.diaCompleto ?? false,
            cancelado: actual.cancelado ?? false,
            rrule: actual.rrule,
            excepciones: actual.excepciones,
            recurrenciaDe: actual.recurrenciaDe,
            calendario: id,
            inicioPared: actual.inicioPared ?? actual.inicio,
            excepcionesPared: actual.excepcionesPared,
            recurrenciaDePared: actual.recurrenciaDePared,
            zona: actual.zona ?? ZONA_POR_DEFECTO,
          })
        }
      } else if (profundidadAjena > 0) {
        profundidadAjena--
      }
      continue
    }

    if (profundidadAjena > 0) continue

    if (!dentroDeEvento) {
      if (clave === 'X-WR-CALNAME') nombre = desescapar(valor).trim()
      continue
    }

    switch (clave) {
      case 'UID':
        actual.uid = valor.trim()
        break
      case 'SUMMARY':
        actual.titulo = desescapar(valor).trim()
        break
      case 'DESCRIPTION':
        actual.descripcion = desescapar(valor).trim()
        break
      case 'LOCATION':
        actual.lugar = desescapar(valor).trim()
        break
      case 'STATUS':
        actual.cancelado = valor.trim().toUpperCase() === 'CANCELLED'
        break
      case 'RRULE':
        actual.rrule = valor.trim()
        break
      case 'DTSTART': {
        const { fecha, pared, diaCompleto, zona } = leerFecha(valor.trim(), parametros)
        actual.inicio = fecha
        actual.inicioPared = pared
        actual.diaCompleto = diaCompleto
        actual.zona = zona
        break
      }
      case 'DTEND':
        actual.fin = leerFecha(valor.trim(), parametros).fecha
        break
      case 'EXDATE':
        for (const trozo of valor.split(',')) {
          const leida = leerFecha(trozo.trim(), parametros)
          actual.excepciones.push(leida.fecha)
          actual.excepcionesPared.push(leida.pared)
        }
        break
      case 'RECURRENCE-ID': {
        const leida = leerFecha(valor.trim(), parametros)
        actual.recurrenciaDe = leida.fecha
        actual.recurrenciaDePared = leida.pared
        break
      }
    }
  }

  return { id, nombre, eventos }
}
