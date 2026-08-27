import { describe, expect, it } from 'vitest'
import { allowedActions } from '@/modules/catalog/domain/actions'

const base = {
  status: 'reservada' as const,
  isStaff: false,
  isOwner: true,
  alreadyExtended: false,
  penalized: false,
  todayISO: '2026-09-05',
  dueISO: '2026-09-29',
}

describe('allowedActions — qué puede hacer cada actor según el estado', () => {
  it('reservada: la dueña solo cancela', () => {
    expect(allowedActions(base)).toEqual(['cancelar'])
  })

  it('reservada: el staff cancela y registra la recogida', () => {
    expect(new Set(allowedActions({ ...base, isStaff: true, isOwner: false }))).toEqual(
      new Set(['cancelar', 'recoger']),
    )
  })

  it('activa: la dueña solo prorroga, y solo dentro de plazo', () => {
    expect(allowedActions({ ...base, status: 'activa' })).toEqual(['prorrogar'])
    expect(allowedActions({ ...base, status: 'activa', todayISO: '2026-09-23' })).toEqual([])
  })

  it('activa: el staff devuelve, marca pérdida y prorroga', () => {
    expect(
      new Set(allowedActions({ ...base, status: 'activa', isStaff: true, isOwner: false })),
    ).toEqual(new Set(['devolver', 'perdida', 'prorrogar']))
  })

  it('activa penalizada: no se ofrece prórroga', () => {
    expect(allowedActions({ ...base, status: 'activa', penalized: true })).toEqual([])
  })

  it('perdida: solo el staff registra la reposición', () => {
    expect(allowedActions({ ...base, status: 'perdida', isStaff: true })).toEqual(['reponer'])
    expect(allowedActions({ ...base, status: 'perdida' })).toEqual([])
  })

  it('perdida ya repuesta: no quedan acciones', () => {
    expect(
      allowedActions({ ...base, status: 'perdida', isStaff: true, alreadyReplaced: true }),
    ).toEqual([])
  })

  it('devuelta y cancelada no admiten nada, ni al staff', () => {
    expect(allowedActions({ ...base, status: 'devuelta', isStaff: true })).toEqual([])
    expect(allowedActions({ ...base, status: 'cancelada', isStaff: true })).toEqual([])
  })

  it('un tercero sin rol no puede nada sobre una reserva ajena', () => {
    expect(allowedActions({ ...base, isOwner: false })).toEqual([])
    expect(allowedActions({ ...base, status: 'activa', isOwner: false })).toEqual([])
  })
})
