/** W5 — Prórroga: +14 días, una vez, hasta vencimiento−7, no en penalizados (R4/A1) */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { expectLoanError } from './helpers/asserts'
import { at, day } from './helpers/dates'
import { registerPickup, requestExtension, reserveItem } from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

/** Préstamo activo recogido el 01-09-2026 (martes): vence el 29-09-2026 */
const prestamoActivo = async (opts: { penalized?: boolean } = {}) => {
  const familia = await createFamilia(payload)
  const staff = await createStaff(payload)
  if (opts.penalized) {
    await payload.update({
      collection: 'users',
      id: familia.id,
      data: { penalizedUntil: at('2027-03-01').toISOString(), lateReturnsCount: 3 },
      overrideAccess: true,
    })
  }
  const item = await createItem(payload)
  const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
  const active = await registerPickup({
    payload,
    user: staff,
    reservationId: r.id,
    now: at('2026-09-01'),
  })
  return { familia, staff, loan: active }
}

describe('W5 — prórroga', () => {
  it('la dueña prorroga en el límite exacto (vencimiento − 7): +14 días', async () => {
    const { familia, loan } = await prestamoActivo()
    const extended = await requestExtension({
      payload,
      user: familia,
      reservationId: loan.id,
      now: at('2026-09-22'),
    })
    expect(day(extended.dueDate)).toBe('2026-10-13')
    expect(day(extended.extension?.requestedAt)).toBe('2026-09-22')
  })

  it('a vencimiento − 6 ya es tarde', async () => {
    const { familia, loan } = await prestamoActivo()
    await expectLoanError(
      requestExtension({ payload, user: familia, reservationId: loan.id, now: at('2026-09-23') }),
      'prorroga-fuera-de-plazo',
    )
  })

  it('no hay segunda prórroga', async () => {
    const { familia, loan } = await prestamoActivo()
    await requestExtension({ payload, user: familia, reservationId: loan.id, now: at('2026-09-08') })
    await expectLoanError(
      requestExtension({ payload, user: familia, reservationId: loan.id, now: at('2026-09-15') }),
      'prorroga-ya-usada',
    )
  })

  it('un préstamo penalizado no se prorroga (A1)', async () => {
    const { familia, loan } = await prestamoActivo({ penalized: true })
    await expectLoanError(
      requestExtension({ payload, user: familia, reservationId: loan.id, now: at('2026-09-03') }),
      'prorroga-penalizado',
    )
  })

  it('otra familia no puede prorrogar un préstamo ajeno', async () => {
    const { loan } = await prestamoActivo()
    const otra = await createFamilia(payload)
    await expectLoanError(
      requestExtension({ payload, user: otra, reservationId: loan.id, now: at('2026-09-08') }),
      'sin-permiso',
    )
  })

  it('el staff sí puede prorrogar el préstamo de una familia', async () => {
    const { staff, loan } = await prestamoActivo()
    const extended = await requestExtension({
      payload,
      user: staff,
      reservationId: loan.id,
      now: at('2026-09-08'),
    })
    expect(day(extended.dueDate)).toBe('2026-10-13')
  })

  it('una reserva sin recoger no se prorroga', async () => {
    const familia = await createFamilia(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await expectLoanError(
      requestExtension({ payload, user: familia, reservationId: r.id, now: at('2026-08-28') }),
      'transicion-invalida',
    )
  })
})
