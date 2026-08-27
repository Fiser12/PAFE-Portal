/** W10 — Perdón: el staff ajusta contador/penalización desde el panel (campos de Users) */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { at, day } from './helpers/dates'
import { registerPickup, registerReturn, reserveItem } from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('W10 — perdón manual', () => {
  it('tras 3 tardías la familia recoge a 14 días; perdonada, vuelve a 28', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)

    const ciclo = async (pickupISO: string, returnISO: string) => {
      const item = await createItem(payload)
      const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at(pickupISO) })
      await registerPickup({ payload, user: staff, reservationId: r.id, now: at(pickupISO) })
      await registerReturn({ payload, user: staff, reservationId: r.id, now: at(returnISO) })
    }
    await ciclo('2026-09-01', '2026-10-06')
    await ciclo('2026-10-06', '2026-11-10')
    await ciclo('2026-11-10', '2026-12-15')

    // penalizada: recogida a 14 días
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-12-15') })
    const penalized = await registerPickup({
      payload,
      user: staff,
      reservationId: r.id,
      now: at('2026-12-15'),
    })
    expect(day(penalized.dueDate)).toBe('2026-12-29')
    await registerReturn({ payload, user: staff, reservationId: r.id, now: at('2026-12-22') })

    // perdón desde el panel: el staff limpia contador y penalización
    await payload.update({
      collection: 'users',
      id: familia.id,
      data: { lateReturnsCount: 0, penalizedUntil: null },
      overrideAccess: true,
    })

    const item2 = await createItem(payload)
    const r2 = await reserveItem({ payload, user: familia, itemId: item2.id, now: at('2027-01-05') })
    const forgiven = await registerPickup({
      payload,
      user: staff,
      reservationId: r2.id,
      now: at('2027-01-05'),
    })
    expect(day(forgiven.dueDate)).toBe('2027-02-02')
  })
})
