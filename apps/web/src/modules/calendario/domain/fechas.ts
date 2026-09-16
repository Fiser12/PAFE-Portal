import type { CodigoIdioma } from '@/core/localization'

const ZONA = 'Europe/Madrid'

/**
 * Los navegadores no traen datos de euskera en Intl: pedir «eu-ES» devuelve
 * castellano sin avisar. Los nombres van escritos aquí para que las fechas no
 * se queden a medio traducir.
 */
const DIAS_EU = [
  'igandea',
  'astelehena',
  'asteartea',
  'asteazkena',
  'osteguna',
  'ostirala',
  'larunbata',
]

const DIAS_CORTOS_EU = ['ig.', 'al.', 'ar.', 'az.', 'og.', 'or.', 'lr.']

const MESES_EU = [
  'urtarrila',
  'otsaila',
  'martxoa',
  'apirila',
  'maiatza',
  'ekaina',
  'uztaila',
  'abuztua',
  'iraila',
  'urria',
  'azaroa',
  'abendua',
]

const intl = (opciones: Intl.DateTimeFormatOptions, fecha: Date, zona: string) =>
  new Intl.DateTimeFormat('es-ES', { ...opciones, timeZone: zona }).format(fecha)

/** «osteguna, irailak 17» / «jueves, 17 de septiembre» */
export const diaLargo = (fecha: Date, idioma: CodigoIdioma): string => {
  if (idioma !== 'eu') {
    return intl({ weekday: 'long', day: 'numeric', month: 'long' }, fecha, 'UTC')
  }
  const dia = DIAS_EU[fecha.getUTCDay()]
  const mes = MESES_EU[fecha.getUTCMonth()]
  return `${dia}, ${mes}k ${fecha.getUTCDate()}`
}

/** «og. 17» / «jue 17» */
export const diaCorto = (fecha: Date, idioma: CodigoIdioma): string => {
  if (idioma !== 'eu') {
    return intl({ weekday: 'short', day: 'numeric' }, fecha, 'UTC')
  }
  return `${DIAS_CORTOS_EU[fecha.getUTCDay()]} ${fecha.getUTCDate()}`
}

/** La hora del día. El reloj de 24 horas se escribe igual en los dos idiomas */
export const hora = (fecha: Date): string =>
  intl({ hour: '2-digit', minute: '2-digit' }, fecha, ZONA)

/** «17/9/2026» en los dos idiomas: el orden del día es el mismo */
export const fechaCorta = (fecha: Date): string =>
  intl({ day: 'numeric', month: 'numeric', year: 'numeric' }, fecha, ZONA)

/** «2026ko irailak 17» / «17 de septiembre de 2026» */
export const fechaLarga = (fecha: Date, idioma: CodigoIdioma): string => {
  if (idioma !== 'eu') {
    return intl({ day: 'numeric', month: 'long', year: 'numeric' }, fecha, ZONA)
  }
  const partes = new Intl.DateTimeFormat('es-ES', {
    timeZone: ZONA,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(fecha)
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0)
  return `${valor('year')}ko ${MESES_EU[valor('month') - 1]}k ${valor('day')}`
}

/** «irailak 17» / «17 de septiembre» */
export const diaYMes = (fecha: Date, idioma: CodigoIdioma): string => {
  if (idioma !== 'eu') return intl({ day: 'numeric', month: 'long' }, fecha, ZONA)
  const partes = new Intl.DateTimeFormat('es-ES', {
    timeZone: ZONA,
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(fecha)
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0)
  return `${MESES_EU[valor('month') - 1]}k ${valor('day')}`
}
