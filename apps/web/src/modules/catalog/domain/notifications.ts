import {
  LATE_RETURN_MESSAGE,
  LATE_RETURN_MESSAGE_EU,
  LOSS_MESSAGE,
  LOSS_MESSAGE_EU,
  reminderEmail,
  toSpanishDate,
} from './messages'

/** El aviso queda guardado tal cual, así que se escribe en los dos idiomas */
const bilingue = (eu: string, es: string) => `${eu}\n\n${es}`

export const NOTIFICATION_TYPES = [
  'recordatorio',
  'vencimiento',
  'devolucion-tardia',
  'perdida',
  'recogida',
  'prorroga',
  'devolucion',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const notificationFor = ({
  type,
  title,
  dueISO,
}: {
  type: NotificationType
  title: string
  dueISO?: string
}): { type: NotificationType; message: string } => {
  const message = (() => {
    switch (type) {
      case 'vencimiento':
      case 'recordatorio': {
        const { eu, es } = reminderEmail({ title, dueISO: dueISO ?? '' })
        return `${eu}\n\n${es}`
      }
      case 'devolucion-tardia':
        return bilingue(
          `${title} epez kanpo itzuli duzu. ${LATE_RETURN_MESSAGE_EU}`,
          `Has devuelto ${title} fuera de plazo. ${LATE_RETURN_MESSAGE}`,
        )
      case 'perdida':
        return bilingue(
          `${title} galdu edo hautsi dela jakinarazi duzu. ${LOSS_MESSAGE_EU}`,
          `Has comunicado la pérdida o rotura de ${title}. ${LOSS_MESSAGE}`,
        )
      case 'recogida':
        return bilingue(
          `${title} eraman duzu. ${toSpanishDate(dueISO ?? '')}(e)an itzuli behar duzu.`,
          `Te has llevado ${title}. Debes devolverlo el ${toSpanishDate(dueISO ?? '')}.`,
        )
      case 'prorroga':
        return bilingue(
          `${title} luzatu duzu. Itzultzeko data berria ${toSpanishDate(dueISO ?? '')} da.`,
          `Has prorrogado ${title}. La nueva fecha de devolución es el ${toSpanishDate(
            dueISO ?? '',
          )}.`,
        )
      case 'devolucion':
        return bilingue(`${title} itzuli duzu. Eskerrik asko!`, `Has devuelto ${title}. ¡Gracias!`)
    }
  })()

  return { type, message }
}
