import { describe, expect, it } from 'vitest'
import {
  LIVE_STATUSES,
  canTransition,
  type ReservationStatus,
} from '@/modules/catalog/domain/lifecycle'

describe('máquina de estados de la reserva (§R11, §R12)', () => {
  const valid: Array<[ReservationStatus, ReservationStatus]> = [
    ['reservada', 'activa'],
    ['reservada', 'cancelada'],
    ['activa', 'devuelta'],
    ['activa', 'perdida'],
  ]

  it.each(valid)('permite %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  const invalid: Array<[ReservationStatus, ReservationStatus]> = [
    ['reservada', 'devuelta'],
    ['reservada', 'perdida'],
    ['activa', 'cancelada'],
    ['activa', 'reservada'],
    ['devuelta', 'activa'],
    ['devuelta', 'reservada'],
    ['perdida', 'activa'],
    ['perdida', 'devuelta'],
    ['cancelada', 'activa'],
    ['cancelada', 'reservada'],
  ]

  it.each(invalid)('rechaza %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })

  it('los estados vivos (comprometen ejemplar y cupo) son reservada, activa y perdida', () => {
    expect(new Set(LIVE_STATUSES)).toEqual(new Set(['reservada', 'activa', 'perdida']))
  })
})
