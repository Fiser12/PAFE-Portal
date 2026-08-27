import { describe, expect, it } from 'vitest'
import {
  REMINDER_DAYS_BEFORE,
  needsDueDayReminder,
  needsReminder,
} from '@/modules/catalog/domain/reminders'

describe('needsReminder — R8: aviso 5 días antes, uno por vencimiento', () => {
  const base = {
    status: 'activa' as const,
    dueISO: '2026-09-29',
    reminderSentForISO: null,
  }

  it('el margen es de 5 días', () => {
    expect(REMINDER_DAYS_BEFORE).toBe(5)
  })

  it('avisa exactamente a vencimiento − 5', () => {
    expect(needsReminder({ ...base, todayISO: '2026-09-24' })).toBe(true)
  })

  it('a vencimiento − 6 aún no', () => {
    expect(needsReminder({ ...base, todayISO: '2026-09-23' })).toBe(false)
  })

  it('recupera un día perdido: a vencimiento − 3 sin aviso previo, avisa', () => {
    expect(needsReminder({ ...base, todayISO: '2026-09-26' })).toBe(true)
  })

  it('el día del vencimiento ya no lo cubre el previo, sino el aviso del día', () => {
    expect(needsReminder({ ...base, todayISO: '2026-09-29' })).toBe(false)
  })

  it('pasado el vencimiento ya no', () => {
    expect(needsReminder({ ...base, todayISO: '2026-09-30' })).toBe(false)
  })

  it('no repite: ya avisado para este vencimiento', () => {
    expect(
      needsReminder({ ...base, todayISO: '2026-09-24', reminderSentForISO: '2026-09-29' }),
    ).toBe(false)
  })

  it('tras una prórroga el aviso del vencimiento viejo no bloquea el nuevo', () => {
    expect(
      needsReminder({
        status: 'activa',
        dueISO: '2026-10-13',
        todayISO: '2026-10-08',
        reminderSentForISO: '2026-09-29',
      }),
    ).toBe(true)
  })

  it('solo los préstamos activos reciben aviso', () => {
    expect(needsReminder({ ...base, status: 'reservada', todayISO: '2026-09-24' })).toBe(false)
    expect(needsReminder({ ...base, status: 'devuelta', todayISO: '2026-09-24' })).toBe(false)
  })
})

describe('needsDueDayReminder — aviso el mismo día del vencimiento', () => {
  const base = {
    status: 'activa' as const,
    dueISO: '2026-09-29',
    dueNoticeSentForISO: null,
  }

  it('avisa el día exacto del vencimiento', () => {
    expect(needsDueDayReminder({ ...base, todayISO: '2026-09-29' })).toBe(true)
  })

  it('la víspera todavía no, y al día siguiente ya no', () => {
    expect(needsDueDayReminder({ ...base, todayISO: '2026-09-28' })).toBe(false)
    expect(needsDueDayReminder({ ...base, todayISO: '2026-09-30' })).toBe(false)
  })

  it('no repite: ya avisado para este vencimiento', () => {
    expect(
      needsDueDayReminder({
        ...base,
        todayISO: '2026-09-29',
        dueNoticeSentForISO: '2026-09-29',
      }),
    ).toBe(false)
  })

  it('tras una prórroga el aviso del vencimiento viejo no bloquea el nuevo', () => {
    expect(
      needsDueDayReminder({
        status: 'activa',
        dueISO: '2026-10-13',
        todayISO: '2026-10-13',
        dueNoticeSentForISO: '2026-09-29',
      }),
    ).toBe(true)
  })

  it('solo los préstamos activos reciben aviso', () => {
    expect(needsDueDayReminder({ ...base, status: 'devuelta', todayISO: '2026-09-29' })).toBe(
      false,
    )
  })
})
