import { LATE_RETURN_MESSAGE, LOSS_MESSAGE, reminderEmail, toSpanishDate } from './messages'

export const NOTIFICATION_TYPES = [
  'recordatorio',
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
      case 'recordatorio': {
        const { eu, es } = reminderEmail({ title, dueISO: dueISO ?? '' })
        return `${eu}\n\n${es}`
      }
      case 'devolucion-tardia':
        return `Has devuelto ${title} fuera de plazo. ${LATE_RETURN_MESSAGE}`
      case 'perdida':
        return `Has comunicado la pérdida o rotura de ${title}. ${LOSS_MESSAGE}`
      case 'recogida':
        return `Te has llevado ${title}. Debes devolverlo el ${toSpanishDate(dueISO ?? '')}.`
      case 'prorroga':
        return `Has prorrogado ${title}. La nueva fecha de devolución es el ${toSpanishDate(
          dueISO ?? '',
        )}.`
      case 'devolucion':
        return `Has devuelto ${title}. ¡Gracias!`
    }
  })()

  return { type, message }
}
