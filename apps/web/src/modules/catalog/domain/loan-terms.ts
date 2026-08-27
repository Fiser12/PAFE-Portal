import type { ReservationStatus } from './lifecycle'
import type { RuleCheck } from './errors'

export const LOAN_DAYS = 28
export const PENALIZED_LOAN_DAYS = 14
export const EXTENSION_DAYS = 14
export const EXTENSION_NOTICE_DAYS = 7

const MADRID_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Día de calendario que un instante representa para PAFE (Europe/Madrid) */
export const madridDateOf = (instant: Date): string => MADRID_FORMATTER.format(instant)

const atUTC = (iso: string): Date => new Date(`${iso}T00:00:00Z`)

const toISODate = (date: Date): string => date.toISOString().slice(0, 10)

export const addDays = (iso: string, days: number): string => {
  const date = atUTC(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return toISODate(date)
}

export const addMonths = (iso: string, months: number): string => {
  const date = atUTC(iso)
  const day = date.getUTCDate()
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const lastDayOfTarget = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(day, lastDayOfTarget))
  return toISODate(target)
}

/** Martes de la semana ISO (lunes-domingo) a la que pertenece la fecha */
export const tuesdayOfWeek = (iso: string): string => {
  const weekday = atUTC(iso).getUTCDay()
  const isoWeekday = weekday === 0 ? 7 : weekday
  return addDays(iso, 2 - isoWeekday)
}

export const computeDueDate = (pickupISO: string, { penalized }: { penalized: boolean }): string =>
  addDays(pickupISO, penalized ? PENALIZED_LOAN_DAYS : LOAN_DAYS)

export const extendDueDate = (dueISO: string): string => addDays(dueISO, EXTENSION_DAYS)

export const canRequestExtension = ({
  status,
  alreadyExtended,
  penalized,
  todayISO,
  dueISO,
}: {
  status: ReservationStatus
  alreadyExtended: boolean
  penalized: boolean
  todayISO: string
  dueISO: string
}): RuleCheck => {
  if (status !== 'activa') return { ok: false, code: 'transicion-invalida' }
  if (alreadyExtended) return { ok: false, code: 'prorroga-ya-usada' }
  if (penalized) return { ok: false, code: 'prorroga-penalizado' }
  if (todayISO > addDays(dueISO, -EXTENSION_NOTICE_DAYS)) {
    return { ok: false, code: 'prorroga-fuera-de-plazo' }
  }
  return { ok: true }
}
