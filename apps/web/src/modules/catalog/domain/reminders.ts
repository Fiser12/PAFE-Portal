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
  return todayISO >= addDays(dueISO, -REMINDER_DAYS_BEFORE) && todayISO <= dueISO
}
