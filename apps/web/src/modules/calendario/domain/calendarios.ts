/**
 * Los calendarios de PAFE. Son públicos en Google por necesidad: el embed no
 * lleva sesión, así que cualquiera con la dirección los ve. Al servirlos desde
 * aquí, al menos el navegador ya no los pide directamente.
 */
export const CALENDARIOS = [
  { id: 'form-continua', color: '#ad1457', fuente: 'd20c77c2f7d9a30e05ba35ba2b8e1c0d2bad4693f316eec41c2968631ae4a0c2@group.calendar.google.com' },
  { id: 'general', color: '#039be5', fuente: 'pafe.gcalendar@gmail.com' },
  { id: 'ocio', color: '#7986cb', fuente: 'ed39c3b5c9029116c740f6269c6f7334e9a2a7677ab87ec43df3cc7c18f738eb@group.calendar.google.com' },
  { id: 'cineforum', color: '#9e69af', fuente: 'c09323ca735f6afc403fcb43777628bb85eb708ca3d92519fe816ca5bd6d5fd8@group.calendar.google.com' },
  { id: 'grupales', color: '#c0ca33', fuente: '0800731e87911cc999e31d592ce0d8445ee9eb98d271ae9de4ea339da274b48b@group.calendar.google.com' },
  { id: 'otras', color: '#8e24aa', fuente: 'a0b86075ef106273714e76991530e741da071e8bc7193b8ed7e230f20c30b5dc@group.calendar.google.com' },
  { id: 'reuniones', color: '#795548', fuente: 'a03d9c2e6d8eb945c5db3dc345800c13d089c0d2b705b219418d85ca4fce4608@group.calendar.google.com' },
  { id: 'safa', color: '#a79b8e', fuente: 'a7aa49d30599079ac9d9836940353477761822b5913ee7a3f0f8a2054a359cda@group.calendar.google.com' },
] as const

export type IdCalendario = (typeof CALENDARIOS)[number]['id']

export const colorDe = (id: string): string =>
  CALENDARIOS.find((cal) => cal.id === id)?.color ?? '#64748b'

export const urlDelFeed = (fuente: string): string =>
  `https://calendar.google.com/calendar/ical/${encodeURIComponent(fuente)}/public/basic.ics`

/**
 * El texto que se lee encima de un color de calendario. Google pone blanco
 * casi siempre, pero sobre el lima o el gris claro no se lee.
 */
export const textoSobre = (fondo: string): string => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(fondo.slice(i, i + 2), 16) / 255)
  const lineal = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminancia = 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b)
  return luminancia > 0.3 ? '#1f2937' : '#ffffff'
}
