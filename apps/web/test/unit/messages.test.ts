import { describe, expect, it } from 'vitest'
import {
  LATE_RETURN_MESSAGE,
  LOSS_MESSAGE,
  reminderEmail,
} from '@/modules/catalog/domain/messages'

describe('reminderEmail — M1: aviso bilingüe con formatos de fecha distintos', () => {
  const email = reminderEmail({ title: 'Modelos de Familia', dueISO: '2026-03-30' })

  it('euskera literal, con la fecha YYYY-MM-DD y el sufijo -an pegado', () => {
    expect(email.eu).toBe(
      'Gogoratu nahi dizugu 2026-03-30an itzuli behar duzula Modelos de Familia',
    )
  })

  it('castellano literal, con la fecha DD-MM-YYYY', () => {
    expect(email.es).toBe(
      'Deseamos recordarle que tiene que devolver Modelos de Familia el 30-03-2026',
    )
  })

  it('el cuerpo lleva los dos idiomas, euskera primero (A3)', () => {
    expect(email.text).toContain(email.eu)
    expect(email.text).toContain(email.es)
    expect(email.text.indexOf(email.eu)).toBeLessThan(email.text.indexOf(email.es))
  })

  it('tiene asunto', () => {
    expect(email.subject.length).toBeGreaterThan(0)
  })

  it('formatea otras fechas correctamente en ambos idiomas', () => {
    const other = reminderEmail({ title: 'X', dueISO: '2026-11-03' })
    expect(other.eu).toContain('2026-11-03an')
    expect(other.es).toContain('el 03-11-2026')
  })
})

describe('literales M2 y M3', () => {
  it('M2 — sensibilidad por devolución tardía', () => {
    expect(LATE_RETURN_MESSAGE).toBe(
      'En caso de devolución tardía, tened en cuenta que esto puede afectar a otras personas del equipo que deseen hacer uso del mismo.',
    )
  })

  it('M3 — reposición por ruptura o pérdida', () => {
    expect(LOSS_MESSAGE).toBe(
      'Por otro lado, en caso de ruptura o pérdida, deberá comprar uno similar y entregarlo a PAFE antes de un mes.',
    )
  })
})
