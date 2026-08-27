import { describe, expect, it } from 'vitest'
import {
  NOTIFICATION_TYPES,
  notificationFor,
} from '@/modules/catalog/domain/notifications'
import { LATE_RETURN_MESSAGE, LOSS_MESSAGE } from '@/modules/catalog/domain/messages'

describe('notificationFor — texto de cada aviso en la web', () => {
  it('los tipos cubren los tres avisos y los tres eventos del préstamo', () => {
    expect(new Set(NOTIFICATION_TYPES)).toEqual(
      new Set([
        'recordatorio',
        'vencimiento',
        'devolucion-tardia',
        'perdida',
        'recogida',
        'prorroga',
        'devolucion',
      ]),
    )
  })

  it('recordatorio: bilingüe, con las dos fechas y el título', () => {
    const n = notificationFor({
      type: 'recordatorio',
      title: 'Modelos de Familia',
      dueISO: '2026-03-30',
    })
    expect(n.message).toContain(
      'Gogoratu nahi dizugu 2026-03-30an itzuli behar duzula Modelos de Familia',
    )
    expect(n.message).toContain(
      'Deseamos recordarle que tiene que devolver Modelos de Familia el 30-03-2026',
    )
  })

  it('vencimiento: mismo literal validado por PAFE, que vale también el día que vence', () => {
    const n = notificationFor({
      type: 'vencimiento',
      title: 'Modelos de Familia',
      dueISO: '2026-03-30',
    })
    expect(n.message).toContain('2026-03-30an itzuli behar duzula Modelos de Familia')
    expect(n.message).toContain('devolver Modelos de Familia el 30-03-2026')
  })

  it('devolución tardía: el literal de sensibilidad de PAFE', () => {
    const n = notificationFor({ type: 'devolucion-tardia', title: 'X' })
    expect(n.message).toContain(LATE_RETURN_MESSAGE)
  })

  it('pérdida: el literal de reposición de PAFE', () => {
    const n = notificationFor({ type: 'perdida', title: 'X' })
    expect(n.message).toContain(LOSS_MESSAGE)
  })

  it('recogida: nombra el material y la fecha de devolución', () => {
    const n = notificationFor({
      type: 'recogida',
      title: 'El Arte de La Terapia Familiar',
      dueISO: '2026-09-29',
    })
    expect(n.message).toContain('El Arte de La Terapia Familiar')
    expect(n.message).toContain('29-09-2026')
  })

  it('prórroga: nombra el material y el vencimiento nuevo', () => {
    const n = notificationFor({ type: 'prorroga', title: 'Y', dueISO: '2026-10-13' })
    expect(n.message).toContain('Y')
    expect(n.message).toContain('13-10-2026')
  })

  it('devolución: confirma la entrega del material', () => {
    const n = notificationFor({ type: 'devolucion', title: 'Z' })
    expect(n.message).toContain('Z')
  })
})
