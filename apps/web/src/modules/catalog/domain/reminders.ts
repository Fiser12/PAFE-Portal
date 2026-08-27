import type { ReservationStatus } from './lifecycle'
import { addDays } from './loan-terms'

export const REMINDER_DAYS_BEFORE = 5

export const needsReminder = ({
  status,
  dueISO,
  todayISO,
  reminderSentForISO,
}: {
  status: ReservationStatus
  dueISO: string
  todayISO: string
  reminderSentForISO?: string | null
}): boolean => {
  if (status !== 'activa') return false
  if (reminderSentForISO === dueISO) return false
  // El día del vencimiento tiene su propio aviso
  return todayISO >= addDays(dueISO, -REMINDER_DAYS_BEFORE) && todayISO < dueISO
}

export const needsDueDayReminder = ({
  status,
  dueISO,
  todayISO,
  dueNoticeSentForISO,
}: {
  status: ReservationStatus
  dueISO: string
  todayISO: string
  dueNoticeSentForISO?: string | null
}): boolean => {
  if (status !== 'activa') return false
  if (dueNoticeSentForISO === dueISO) return false
  return todayISO === dueISO
}
