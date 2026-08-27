/** W3 — Cancelar una reserva pendiente */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { expectLoanError } from './helpers/asserts'
import { at } from './helpers/dates'
import { cancelReservation, registerPickup, reserveItem } from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('W3 — cancelar', () => {
  it('la familia cancela su reserva pendiente', async () => {
    const familia = await createFamilia(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })

    const cancelled = await cancelReservation({ payload, user: familia, reservationId: r.id })
    expect(cancelled.status).toBe('cancelada')
  })

  it('cancelar libera cupo', async () => {
    const familia = await createFamilia(payload)
    const [a, b, c] = await Promise.all([
      createItem(payload),
      createItem(payload),
      createItem(payload),
    ])
    const ra = await reserveItem({ payload, user: familia, itemId: a.id, now: at('2026-08-27') })
    await reserveItem({ payload, user: familia, itemId: b.id, now: at('2026-08-27') })
    await cancelReservation({ payload, user: familia, reservationId: ra.id })

    const rc = await reserveItem({ payload, user: familia, itemId: c.id, now: at('2026-08-28') })
    expect(rc.status).toBe('reservada')
  })

  it('una familia no cancela reservas ajenas', async () => {
    const familia = await createFamilia(payload)
    const otra = await createFamilia(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })

    await expectLoanError(
      cancelReservation({ payload, user: otra, reservationId: r.id }),
      'sin-permiso',
    )
  })

  it('el staff cancela cualquier reserva pendiente', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })

    const cancelled = await cancelReservation({ payload, user: staff, reservationId: r.id })
    expect(cancelled.status).toBe('cancelada')
  })

  it('una reserva ya recogida no se cancela: se devuelve o se pierde', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })

    await expectLoanError(
      cancelReservation({ payload, user: staff, reservationId: r.id }),
      'transicion-invalida',
    )
  })
})
