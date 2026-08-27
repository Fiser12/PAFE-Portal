/** Avisos en la web: cada evento del préstamo deja notificación a la familia */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { expectLoanError } from './helpers/asserts'
import { at } from './helpers/dates'
import { resetEmails } from './helpers/email'
import {
  markNotificationsRead,
  registerPickup,
  registerReturn,
  reportLoss,
  requestExtension,
  reserveItem,
  runDueReminders,
  userNotifications,
} from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(resetEmails)

const tipos = async (userId: number) =>
  (await userNotifications({ payload, userId })).map((n) => n.type)

describe('notificaciones de los eventos del préstamo', () => {
  it('la recogida avisa a la familia, no al staff', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })

    expect(await tipos(familia.id)).toEqual(['recogida'])
    expect(await tipos(staff.id)).toEqual([])
  })

  it('la prórroga deja su aviso', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })
    await requestExtension({ payload, user: familia, reservationId: r.id, now: at('2026-09-08') })

    expect(await tipos(familia.id)).toContain('prorroga')
  })

  it('devolver en plazo confirma; devolver tarde añade el aviso de tardía', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const enPlazo = await createItem(payload)
    const r1 = await reserveItem({
      payload,
      user: familia,
      itemId: enPlazo.id,
      now: at('2026-08-27'),
    })
    await registerPickup({ payload, user: staff, reservationId: r1.id, now: at('2026-09-01') })
    await registerReturn({ payload, user: staff, reservationId: r1.id, now: at('2026-09-15') })

    expect(await tipos(familia.id)).toContain('devolucion')
    expect(await tipos(familia.id)).not.toContain('devolucion-tardia')

    const tarde = await createItem(payload)
    const r2 = await reserveItem({ payload, user: familia, itemId: tarde.id, now: at('2026-09-15') })
    await registerPickup({ payload, user: staff, reservationId: r2.id, now: at('2026-09-15') })
    await registerReturn({ payload, user: staff, reservationId: r2.id, now: at('2026-10-20') })

    expect(await tipos(familia.id)).toContain('devolucion-tardia')
  })

  it('la pérdida deja su aviso', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })
    await reportLoss({ payload, user: staff, reservationId: r.id, now: at('2026-09-15') })

    expect(await tipos(familia.id)).toContain('perdida')
  })

  it('el recordatorio deja aviso web además del correo, sin duplicar', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-09-01') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })

    await runDueReminders({ payload, now: at('2026-09-24') })
    await runDueReminders({ payload, now: at('2026-09-24') })

    const recordatorios = (await tipos(familia.id)).filter((t) => t === 'recordatorio')
    expect(recordatorios).toHaveLength(1)
  })
})

describe('lectura de notificaciones', () => {
  it('nacen sin leer y el panel las marca todas', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })

    const antes = await userNotifications({ payload, userId: familia.id })
    expect(antes.every((n) => !n.readAt)).toBe(true)

    await markNotificationsRead({ payload, user: familia, now: at('2026-09-02') })

    const despues = await userNotifications({ payload, userId: familia.id })
    expect(despues.every((n) => Boolean(n.readAt))).toBe(true)
  })

  it('una familia no puede marcar como leídas las de otra', async () => {
    const familia = await createFamilia(payload)
    const otra = await createFamilia(payload)
    await expectLoanError(
      markNotificationsRead({
        payload,
        user: otra,
        forUserId: familia.id,
        now: at('2026-09-02'),
      }),
      'sin-permiso',
    )
  })
})
