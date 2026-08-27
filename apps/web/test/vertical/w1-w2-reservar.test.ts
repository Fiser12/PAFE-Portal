/** W1/W2 — Reservar material (familia y staff), R5 cupo, R6 duplicados, R7 stock */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createPendiente, createStaff } from './helpers/factory'
import { expectLoanError } from './helpers/asserts'
import { at, day } from './helpers/dates'
import { resetEmails } from './helpers/email'
import {
  registerPickup,
  registerReturn,
  reportLoss,
  reserveItem,
} from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(resetEmails)

describe('W1 — familia reserva para sí', () => {
  it('crea la reserva en estado reservada con su fecha de solicitud', async () => {
    const familia = await createFamilia(payload)
    const item = await createItem(payload)

    const r = await reserveItem({
      payload,
      user: familia,
      itemId: item.id,
      now: at('2026-08-27'),
    })

    expect(r.status).toBe('reservada')
    expect(day(r.reservationDate)).toBe('2026-08-27')
  })

  it('un usuario sin rol no puede reservar', async () => {
    const pendiente = await createPendiente(payload)
    const item = await createItem(payload)
    await expectLoanError(
      reserveItem({ payload, user: pendiente, itemId: item.id, now: at('2026-08-27') }),
      'sin-permiso',
    )
  })

  it('una familia no puede reservar en nombre de otra', async () => {
    const familia = await createFamilia(payload)
    const otra = await createFamilia(payload)
    const item = await createItem(payload)
    await expectLoanError(
      reserveItem({
        payload,
        user: familia,
        itemId: item.id,
        forUserId: otra.id,
        now: at('2026-08-27'),
      }),
      'sin-permiso',
    )
  })

  it('rechaza la reserva duplicada de un material con reserva viva (R6)', async () => {
    const familia = await createFamilia(payload)
    const item = await createItem(payload, { quantity: 5 })
    await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await expectLoanError(
      reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-28') }),
      'reserva-duplicada',
    )
  })

  it('un material devuelto se puede volver a reservar (la reserva cerrada no bloquea)', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)

    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })
    await registerReturn({ payload, user: staff, reservationId: r.id, now: at('2026-09-29') })

    const again = await reserveItem({
      payload,
      user: familia,
      itemId: item.id,
      now: at('2026-10-01'),
    })
    expect(again.status).toBe('reservada')
  })

  it('sin ejemplares disponibles no hay reserva (R7)', async () => {
    const familia = await createFamilia(payload)
    const otra = await createFamilia(payload)
    const item = await createItem(payload, { quantity: 1 })
    await reserveItem({ payload, user: otra, itemId: item.id, now: at('2026-08-27') })
    await expectLoanError(
      reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') }),
      'sin-stock',
    )
  })
})

describe('R5 — cupo de dos materiales', () => {
  it('con 2 reservas vivas (reservada + activa) la tercera cae', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const [a, b, c] = await Promise.all([
      createItem(payload),
      createItem(payload),
      createItem(payload),
    ])

    const ra = await reserveItem({ payload, user: familia, itemId: a.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: ra.id, now: at('2026-09-01') })
    await reserveItem({ payload, user: familia, itemId: b.id, now: at('2026-09-02') })

    await expectLoanError(
      reserveItem({ payload, user: familia, itemId: c.id, now: at('2026-09-03') }),
      'cupo-lleno',
    )
  })

  it('una pérdida sin reponer sigue ocupando cupo', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const [a, b, c] = await Promise.all([
      createItem(payload),
      createItem(payload),
      createItem(payload),
    ])

    const ra = await reserveItem({ payload, user: familia, itemId: a.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: ra.id, now: at('2026-09-01') })
    await reportLoss({ payload, user: staff, reservationId: ra.id, now: at('2026-09-08') })
    await reserveItem({ payload, user: familia, itemId: b.id, now: at('2026-09-09') })

    await expectLoanError(
      reserveItem({ payload, user: familia, itemId: c.id, now: at('2026-09-10') }),
      'cupo-lleno',
    )
  })

  it('devolver libera cupo', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const [a, b, c] = await Promise.all([
      createItem(payload),
      createItem(payload),
      createItem(payload),
    ])

    const ra = await reserveItem({ payload, user: familia, itemId: a.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: ra.id, now: at('2026-09-01') })
    await reserveItem({ payload, user: familia, itemId: b.id, now: at('2026-09-02') })
    await registerReturn({ payload, user: staff, reservationId: ra.id, now: at('2026-09-29') })

    const rc = await reserveItem({ payload, user: familia, itemId: c.id, now: at('2026-09-30') })
    expect(rc.status).toBe('reservada')
  })
})

describe('W2 — staff en nombre de una familia', () => {
  it('el staff reserva para una familia', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const item = await createItem(payload)

    const r = await reserveItem({
      payload,
      user: staff,
      itemId: item.id,
      forUserId: familia.id,
      now: at('2026-08-27'),
    })
    expect(r.status).toBe('reservada')
    const ownerId = typeof r.user === 'object' ? r.user.id : r.user
    expect(String(ownerId)).toBe(String(familia.id))
  })

  it('exceder el cupo sin justificación: justificacion-requerida', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const [a, b, c] = await Promise.all([
      createItem(payload),
      createItem(payload),
      createItem(payload),
    ])
    await reserveItem({ payload, user: familia, itemId: a.id, now: at('2026-08-27') })
    await reserveItem({ payload, user: familia, itemId: b.id, now: at('2026-08-27') })

    await expectLoanError(
      reserveItem({
        payload,
        user: staff,
        itemId: c.id,
        forUserId: familia.id,
        now: at('2026-08-28'),
      }),
      'justificacion-requerida',
    )
  })

  it('exceder el cupo con justificación queda registrado', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const [a, b, c] = await Promise.all([
      createItem(payload),
      createItem(payload),
      createItem(payload),
    ])
    await reserveItem({ payload, user: familia, itemId: a.id, now: at('2026-08-27') })
    await reserveItem({ payload, user: familia, itemId: b.id, now: at('2026-08-27') })

    const r = await reserveItem({
      payload,
      user: staff,
      itemId: c.id,
      forUserId: familia.id,
      quotaOverrideReason: 'Material de apoyo urgente para el caso 12',
      now: at('2026-08-28'),
    })
    expect(r.status).toBe('reservada')
    expect(r.quotaOverrideReason).toBe('Material de apoyo urgente para el caso 12')
  })
})
