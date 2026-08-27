/** W8 — Aviso automático de devolución: 5 días antes, uno por vencimiento, bilingüe (R8/M1) */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { at, day } from './helpers/dates'
import { bodyOf, emailFailures, emailsTo, resetEmails } from './helpers/email'
import {
  registerPickup,
  registerReturn,
  requestExtension,
  reserveItem,
  runDueReminders,
} from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(resetEmails)

/** Préstamo activo con recogida el martes indicado (vence +28) */
const prestamoActivo = async (pickupISO: string, title?: string) => {
  const familia = await createFamilia(payload)
  const staff = await createStaff(payload)
  const item = await createItem(payload, { title })
  const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at(pickupISO) })
  const active = await registerPickup({
    payload,
    user: staff,
    reservationId: r.id,
    now: at(pickupISO),
  })
  return { familia, staff, item, loan: active }
}

describe('W8 — avisos de devolución', () => {
  it('a vencimiento − 5 envía el aviso bilingüe con los literales de M1', async () => {
    // recogida 01-09 → vence 29-09; aviso el 24-09
    const { familia } = await prestamoActivo('2026-09-01', 'Modelos de Familia')

    const result = await runDueReminders({ payload, now: at('2026-09-24') })
    expect(result.sent).toBe(1)

    const mails = emailsTo(familia.email)
    expect(mails).toHaveLength(1)
    const body = bodyOf(mails[0]!)
    const eu = 'Gogoratu nahi dizugu 2026-09-29an itzuli behar duzula Modelos de Familia'
    const es = 'Deseamos recordarle que tiene que devolver Modelos de Familia el 29-09-2026'
    expect(body).toContain(eu)
    expect(body).toContain(es)
    expect(body.indexOf(eu)).toBeLessThan(body.indexOf(es))
  })

  it('no duplica: la segunda ejecución del mismo día no reenvía', async () => {
    const { familia, loan } = await prestamoActivo('2026-09-01')

    await runDueReminders({ payload, now: at('2026-09-24') })
    const second = await runDueReminders({ payload, now: at('2026-09-24') })

    expect(second.sent).toBe(0)
    expect(emailsTo(familia.email)).toHaveLength(1)

    const doc = await payload.findByID({ collection: 'reservation', id: loan.id })
    expect(day(doc.reminderSentFor)).toBe('2026-09-29')
  })

  it('a vencimiento − 6 no avisa todavía', async () => {
    const { familia } = await prestamoActivo('2026-09-01')
    await runDueReminders({ payload, now: at('2026-09-23') })
    expect(emailsTo(familia.email)).toHaveLength(0)
  })

  it('recupera un día de job caído: a vencimiento − 3 sin aviso previo, avisa', async () => {
    const { familia } = await prestamoActivo('2026-09-01')
    await runDueReminders({ payload, now: at('2026-09-26') })
    expect(emailsTo(familia.email)).toHaveLength(1)
  })

  it('pasado el vencimiento ya no avisa', async () => {
    const { familia } = await prestamoActivo('2026-09-01')
    await runDueReminders({ payload, now: at('2026-09-30') })
    expect(emailsTo(familia.email)).toHaveLength(0)
  })

  it('las reservas sin recoger y los préstamos devueltos no reciben aviso', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    // pendiente de recoger
    await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-09-01') })
    // devuelto antes del aviso
    const otra = await createFamilia(payload)
    const item2 = await createItem(payload)
    const r2 = await reserveItem({ payload, user: otra, itemId: item2.id, now: at('2026-09-01') })
    await registerPickup({ payload, user: staff, reservationId: r2.id, now: at('2026-09-01') })
    await registerReturn({ payload, user: staff, reservationId: r2.id, now: at('2026-09-22') })

    const result = await runDueReminders({ payload, now: at('2026-09-24') })
    expect(result.sent).toBe(0)
    expect(emailsTo(familia.email)).toHaveLength(0)
    expect(emailsTo(otra.email)).toHaveLength(0)
  })

  it('la prórroga re-arma el aviso para el nuevo vencimiento', async () => {
    const { familia, loan } = await prestamoActivo('2026-09-01')
    // prórroga el 22-09: vence 13-10; aviso el 08-10
    await requestExtension({ payload, user: familia, reservationId: loan.id, now: at('2026-09-22') })

    await runDueReminders({ payload, now: at('2026-09-24') })
    expect(emailsTo(familia.email)).toHaveLength(0)

    const result = await runDueReminders({ payload, now: at('2026-10-08') })
    expect(result.sent).toBe(1)
    const mails = emailsTo(familia.email)
    expect(mails).toHaveLength(1)
    expect(bodyOf(mails[0]!)).toContain('2026-10-13an')
  })

  it('avisa también el mismo día del vencimiento, aparte del previo', async () => {
    // recogida 01-09 -> vence 29-09: aviso previo el 24-09 y del día el 29-09
    const { familia } = await prestamoActivo('2026-09-01')

    await runDueReminders({ payload, now: at('2026-09-24') })
    expect(emailsTo(familia.email)).toHaveLength(1)

    const elDia = await runDueReminders({ payload, now: at('2026-09-29') })
    expect(elDia.sent).toBe(1)
    expect(emailsTo(familia.email)).toHaveLength(2)
  })

  it('el aviso del día no se repite si el job corre dos veces', async () => {
    const { familia } = await prestamoActivo('2026-09-01')

    await runDueReminders({ payload, now: at('2026-09-29') })
    const segunda = await runDueReminders({ payload, now: at('2026-09-29') })

    expect(segunda.sent).toBe(0)
    expect(emailsTo(familia.email)).toHaveLength(1)
  })

  it('el aviso del día llega aunque el previo no se enviara', async () => {
    const { familia } = await prestamoActivo('2026-09-01')

    const elDia = await runDueReminders({ payload, now: at('2026-09-29') })
    expect(elDia.sent).toBe(1)
    expect(emailsTo(familia.email)).toHaveLength(1)
  })

  it('si el envío falla no marca el aviso y la siguiente ejecución reintenta', async () => {
    const { familia, loan } = await prestamoActivo('2026-09-01')

    emailFailures.failNextSend = true
    const failed = await runDueReminders({ payload, now: at('2026-09-24') })
    expect(failed.sent).toBe(0)
    expect(emailsTo(familia.email)).toHaveLength(0)
    const doc = await payload.findByID({ collection: 'reservation', id: loan.id })
    expect(doc.reminderSentFor ?? null).toBeNull()

    const retried = await runDueReminders({ payload, now: at('2026-09-25') })
    expect(retried.sent).toBe(1)
    expect(emailsTo(familia.email)).toHaveLength(1)
  })
})
