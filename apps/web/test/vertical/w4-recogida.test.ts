/** W4 — Recogida en la reunión: arranca el préstamo y fija el vencimiento (R1/R2) */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { expectLoanError } from './helpers/asserts'
import { at, day } from './helpers/dates'
import { cancelReservation, registerPickup, reserveItem } from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const reservaDe = async (familia: Awaited<ReturnType<typeof createFamilia>>) => {
  const item = await createItem(payload)
  return reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
}

describe('W4 — recogida', () => {
  it('la familia no puede registrar recogidas', async () => {
    const familia = await createFamilia(payload)
    const r = await reservaDe(familia)
    await expectLoanError(
      registerPickup({ payload, user: familia, reservationId: r.id, now: at('2026-09-01') }),
      'sin-permiso',
    )
  })

  it('recogida en martes: activa, con vencimiento a 28 días (martes)', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const r = await reservaDe(familia)

    const active = await registerPickup({
      payload,
      user: staff,
      reservationId: r.id,
      now: at('2026-09-01'),
    })
    expect(active.status).toBe('activa')
    expect(day(active.pickupDate)).toBe('2026-09-01')
    expect(day(active.dueDate)).toBe('2026-09-29')
  })

  it('registrada en miércoles se normaliza al martes de esa semana (A5)', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const r = await reservaDe(familia)

    const active = await registerPickup({
      payload,
      user: staff,
      reservationId: r.id,
      pickupDate: at('2026-09-02'),
      now: at('2026-09-02'),
    })
    expect(day(active.pickupDate)).toBe('2026-09-01')
    expect(day(active.dueDate)).toBe('2026-09-29')
  })

  it('familia penalizada: plazo de 14 días (R2)', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    await payload.update({
      collection: 'users',
      id: familia.id,
      data: { penalizedUntil: at('2027-03-01').toISOString(), lateReturnsCount: 3 },
      overrideAccess: true,
    })
    const r = await reservaDe(familia)

    const active = await registerPickup({
      payload,
      user: staff,
      reservationId: r.id,
      now: at('2026-09-01'),
    })
    expect(day(active.dueDate)).toBe('2026-09-15')
  })

  it('penalización expirada: plazo normal de 28 días', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    await payload.update({
      collection: 'users',
      id: familia.id,
      data: { penalizedUntil: at('2026-01-01').toISOString(), lateReturnsCount: 3 },
      overrideAccess: true,
    })
    const r = await reservaDe(familia)

    const active = await registerPickup({
      payload,
      user: staff,
      reservationId: r.id,
      now: at('2026-09-01'),
    })
    expect(day(active.dueDate)).toBe('2026-09-29')
  })

  it('solo se recoge lo reservado: sobre activa, transicion-invalida', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const r = await reservaDe(familia)
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })

    await expectLoanError(
      registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-08') }),
      'transicion-invalida',
    )
  })

  it('sobre cancelada, transicion-invalida', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const r = await reservaDe(familia)
    await cancelReservation({ payload, user: familia, reservationId: r.id })

    await expectLoanError(
      registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') }),
      'transicion-invalida',
    )
  })
})
