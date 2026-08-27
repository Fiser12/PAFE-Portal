import type { Payload } from 'payload'
import { addDays, madridDateOf } from '../domain/loan-terms'
import { reminderEmail } from '../domain/messages'
import { REMINDER_DAYS_BEFORE, needsReminder } from '../domain/reminders'
import { dayOf, dayToInstant, loadItemTitle, loadUser, relationId } from './shared'
import { notify } from './notifications'

export const runDueReminders = async ({
  payload,
  now,
}: {
  payload: Payload
  now: Date
}): Promise<{ sent: number }> => {
  const todayISO = madridDateOf(now)

  const candidates = await payload.find({
    collection: 'reservation',
    where: {
      and: [
        { status: { equals: 'activa' } },
        { dueDate: { greater_than_equal: dayToInstant(todayISO) } },
        {
          dueDate: {
            less_than_equal: dayToInstant(addDays(todayISO, REMINDER_DAYS_BEFORE)),
          },
        },
      ],
    },
    depth: 0,
    limit: 0,
    overrideAccess: true,
  })

  let sent = 0
  for (const reservation of candidates.docs) {
    const dueISO = dayOf(reservation.dueDate)
    if (
      !dueISO ||
      !needsReminder({
        status: reservation.status,
        dueISO,
        todayISO,
        reminderSentForISO: dayOf(reservation.reminderSentFor),
      })
    ) {
      continue
    }

    const owner = await loadUser(payload, relationId(reservation.user))
    const title = await loadItemTitle(payload, relationId(reservation.item))

    try {
      await payload.sendEmail({ to: owner.email, ...reminderEmail({ title, dueISO }) })
    } catch (error) {
      // Sin marcar: la siguiente ejecución del job reintenta este aviso
      payload.logger.error(
        `[recordatorios] fallo enviando el aviso de la reserva ${reservation.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      continue
    }

    await notify({
      payload,
      userId: owner.id,
      reservationId: reservation.id,
      type: 'recordatorio',
      title,
      dueISO,
    })

    await payload.update({
      collection: 'reservation',
      id: reservation.id,
      data: { reminderSentFor: dayToInstant(dueISO) },
      overrideAccess: true,
    })
    sent += 1
  }

  return { sent }
}
