/** R7 — Disponibilidad: stock menos reservas vivas */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { at } from './helpers/dates'
import {
  cancelReservation,
  getAvailability,
  registerPickup,
  registerReturn,
  reserveItem,
} from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('getAvailability', () => {
  it('resta reservadas y activas; devolver y cancelar liberan', async () => {
    const staff = await createStaff(payload)
    const f1 = await createFamilia(payload)
    const f2 = await createFamilia(payload)
    const item = await createItem(payload, { quantity: 2 })

    expect(await getAvailability({ payload, itemId: item.id })).toMatchObject({
      total: 2,
      available: 2,
    })

    const r1 = await reserveItem({ payload, user: f1, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r1.id, now: at('2026-09-01') })
    const r2 = await reserveItem({ payload, user: f2, itemId: item.id, now: at('2026-09-02') })

    expect(await getAvailability({ payload, itemId: item.id })).toMatchObject({ available: 0 })

    await registerReturn({ payload, user: staff, reservationId: r1.id, now: at('2026-09-15') })
    expect(await getAvailability({ payload, itemId: item.id })).toMatchObject({ available: 1 })

    await cancelReservation({ payload, user: f2, reservationId: r2.id })
    expect(await getAvailability({ payload, itemId: item.id })).toMatchObject({ available: 2 })
  })
})
