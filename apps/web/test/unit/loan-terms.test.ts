import { describe, expect, it } from 'vitest'
import {
  addDays,
  canRequestExtension,
  computeDueDate,
  extendDueDate,
  madridDateOf,
  tuesdayOfWeek,
} from '@/modules/catalog/domain/loan-terms'

// Martes reales de 2026 usados en esta suite: 01-09, 29-09, 24-03, 21-04,
// 20-10, 17-11, 15-09, 13-10. Verificados contra calendario.

describe('madridDateOf — fecha de calendario en Europe/Madrid', () => {
  it('un instante nocturno UTC de verano cae en el día siguiente de Madrid (CEST +2)', () => {
    expect(madridDateOf(new Date('2026-08-25T22:30:00Z'))).toBe('2026-08-26')
  })

  it('un instante nocturno UTC de invierno cae en el día siguiente de Madrid (CET +1)', () => {
    expect(madridDateOf(new Date('2026-01-06T23:30:00Z'))).toBe('2026-01-07')
  })

  it('un instante de tarde se queda en su día', () => {
    expect(madridDateOf(new Date('2026-08-25T21:59:00Z'))).toBe('2026-08-25')
  })
})

describe('tuesdayOfWeek — martes de la semana ISO (lunes-domingo)', () => {
  it('un martes es su propio martes', () => {
    expect(tuesdayOfWeek('2026-09-01')).toBe('2026-09-01')
  })

  it('miércoles normaliza al martes anterior', () => {
    expect(tuesdayOfWeek('2026-09-02')).toBe('2026-09-01')
  })

  it('lunes normaliza al martes siguiente (misma semana ISO)', () => {
    expect(tuesdayOfWeek('2026-08-31')).toBe('2026-09-01')
  })

  it('sábado y domingo normalizan al martes de su semana', () => {
    expect(tuesdayOfWeek('2026-09-05')).toBe('2026-09-01')
    expect(tuesdayOfWeek('2026-09-06')).toBe('2026-09-01')
  })

  it('cruza el año: el jueves 2026-01-01 pertenece a la semana del martes 2025-12-30', () => {
    expect(tuesdayOfWeek('2026-01-01')).toBe('2025-12-30')
  })
})

describe('addDays — aritmética de calendario pura', () => {
  it('suma días a través del cambio de hora de marzo sin desviarse', () => {
    expect(addDays('2026-03-27', 3)).toBe('2026-03-30')
  })

  it('suma trivial', () => {
    expect(addDays('2026-09-01', 28)).toBe('2026-09-29')
  })
})

describe('computeDueDate — R1/R2: vencimiento martes a martes', () => {
  it('plazo normal: recogida + 28 días', () => {
    expect(computeDueDate('2026-09-01', { penalized: false })).toBe('2026-09-29')
  })

  it('plazo penalizado: recogida + 14 días', () => {
    expect(computeDueDate('2026-09-01', { penalized: true })).toBe('2026-09-15')
  })

  it('cruza el cambio de hora de marzo (29-03-2026) y sigue cayendo en martes', () => {
    expect(computeDueDate('2026-03-24', { penalized: false })).toBe('2026-04-21')
  })

  it('cruza el cambio de hora de octubre (25-10-2026) y sigue cayendo en martes', () => {
    expect(computeDueDate('2026-10-20', { penalized: false })).toBe('2026-11-17')
  })
})

describe('extendDueDate — R4: prórroga de 14 días', () => {
  it('suma 14 días y sigue siendo martes', () => {
    expect(extendDueDate('2026-09-29')).toBe('2026-10-13')
  })
})

describe('canRequestExtension — R4: ventana y condiciones', () => {
  const base = {
    status: 'activa' as const,
    alreadyExtended: false,
    penalized: false,
    dueISO: '2026-09-29',
  }

  it('permite en el límite exacto: hoy = vencimiento − 7', () => {
    expect(canRequestExtension({ ...base, todayISO: '2026-09-22' })).toEqual({ ok: true })
  })

  it('permite antes del límite', () => {
    expect(canRequestExtension({ ...base, todayISO: '2026-09-05' })).toEqual({ ok: true })
  })

  it('rechaza a vencimiento − 6: prorroga-fuera-de-plazo', () => {
    expect(canRequestExtension({ ...base, todayISO: '2026-09-23' })).toEqual({
      ok: false,
      code: 'prorroga-fuera-de-plazo',
    })
  })

  it('rechaza una segunda prórroga: prorroga-ya-usada', () => {
    expect(
      canRequestExtension({ ...base, alreadyExtended: true, todayISO: '2026-09-05' }),
    ).toEqual({ ok: false, code: 'prorroga-ya-usada' })
  })

  it('rechaza en préstamo penalizado: prorroga-penalizado (A1)', () => {
    expect(canRequestExtension({ ...base, penalized: true, todayISO: '2026-09-05' })).toEqual({
      ok: false,
      code: 'prorroga-penalizado',
    })
  })

  it('rechaza si el préstamo no está activo: transicion-invalida', () => {
    expect(
      canRequestExtension({ ...base, status: 'reservada', todayISO: '2026-09-05' }),
    ).toEqual({ ok: false, code: 'transicion-invalida' })
  })
})
