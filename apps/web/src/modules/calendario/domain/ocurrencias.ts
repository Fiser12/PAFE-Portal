import { RRule, rrulestr } from 'rrule'
import { aHoraPared, deHoraPared, type EventoIcs } from './ics'

export interface Ocurrencia {
  uid: string
  titulo: string
  descripcion?: string
  lugar?: string
  inicio: Date
  fin: Date
  diaCompleto: boolean
  calendario: string
}

/** Tope de seguridad: un calendario mal configurado no debe colgar la página */
const MAXIMO = 400

const mismoInstante = (a: Date, b: Date) => a.getTime() === b.getTime()

const comoOcurrencia = (evento: EventoIcs, inicio: Date): Ocurrencia => ({
  uid: evento.uid,
  titulo: evento.titulo,
  descripcion: evento.descripcion,
  lugar: evento.lugar,
  inicio,
  fin: new Date(inicio.getTime() + (evento.fin.getTime() - evento.inicio.getTime())),
  diaCompleto: evento.diaCompleto,
  calendario: evento.calendario,
})

const comoCadenaUtc = (fecha: Date) => `${fecha.toISOString().replace(/[-:.]/g, '').slice(0, 15)}Z`

/**
 * Las repeticiones se calculan sobre la hora de pared, no sobre el instante.
 * Si se hiciera en UTC, una reunión de las 10:00 pasaría a las 11:00 el día
 * que cambia la hora, y sus excepciones dejarían de casar.
 */
const repeticionesPared = (evento: EventoIcs, desde: Date, hasta: Date): Date[] => {
  if (!evento.rrule) return [evento.inicioPared]

  try {
    const regla = rrulestr(
      `DTSTART:${comoCadenaUtc(evento.inicioPared)}\nRRULE:${evento.rrule}`,
    ) as RRule
    return regla
      .between(aHoraPared(desde, evento.zona), aHoraPared(hasta, evento.zona), true)
      .slice(0, MAXIMO)
  } catch {
    // Una regla que no entendemos no debe tumbar el calendario entero
    return [evento.inicioPared]
  }
}

/**
 * Despliega los eventos en las veces que ocurren dentro del rango pedido.
 *
 * Una instancia retocada (la que trae RECURRENCE-ID) sustituye a la que
 * generaría la serie; no se añade encima, que es como salen los duplicados.
 */
export const ocurrenciasEntre = (
  eventos: EventoIcs[],
  desde: Date,
  hasta: Date,
): Ocurrencia[] => {
  const vivos = eventos.filter((evento) => !evento.cancelado)
  const retocadas = vivos.filter((evento) => evento.recurrenciaDe)
  const series = vivos.filter((evento) => !evento.recurrenciaDe)

  const salida: Ocurrencia[] = []

  for (const evento of series) {
    const sustituidas = retocadas
      .filter((otra) => otra.uid === evento.uid)
      .map((otra) => otra.recurrenciaDePared ?? otra.inicioPared)

    for (const pared of repeticionesPared(evento, desde, hasta)) {
      if (evento.excepcionesPared.some((exc) => mismoInstante(exc, pared))) continue
      if (sustituidas.some((exc) => mismoInstante(exc, pared))) continue

      const inicio = evento.diaCompleto ? pared : deHoraPared(pared, evento.zona)
      if (inicio < desde || inicio > hasta) continue
      salida.push(comoOcurrencia(evento, inicio))
    }
  }

  for (const retocada of retocadas) {
    if (retocada.inicio >= desde && retocada.inicio <= hasta) {
      salida.push(comoOcurrencia(retocada, retocada.inicio))
    }
  }

  return salida.sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
}
