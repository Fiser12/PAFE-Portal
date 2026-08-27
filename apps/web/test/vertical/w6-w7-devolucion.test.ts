/** W6/W7 — Devolución en plazo y tardía: M2, contador y penalización (R9) */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { expectLoanError } from './helpers/asserts'
import { at, day } from './helpers/dates'
import { bodyOf, emailsTo, resetEmails } from './helpers/email'
import { LATE_RETURN_MESSAGE } from '@/modules/catalog/domain/messages'
import { registerPickup, registerReturn, reserveItem } from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(resetEmails)

type Familia = Awaited<ReturnType<typeof createFamilia>>
type Staff = Awaited<ReturnType<typeof createStaff>>

/** Ciclo completo: reservar → recoger (martes) → devolver en returnISO */
const cicloPrestamo = async (
  familia: Familia,
  staff: Staff,
  pickupISO: string,
  returnISO: string,
) => {
  const item = await createItem(payload)
  const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at(pickupISO) })
  await registerPickup({ payload, user: staff, reservationId: r.id, now: at(pickupISO) })
  return registerReturn({ payload, user: staff, reservationId: r.id, now: at(returnISO) })
}

const userDoc = (id: number | string) =>
  payload.findByID({ collection: 'users', id, overrideAccess: true })

describe('W6 — devolución en plazo', () => {
  it('solo el staff registra devoluciones', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: r.id, now: at('2026-09-01') })

    await expectLoanError(
      registerReturn({ payload, user: familia, reservationId: r.id, now: at('2026-09-15') }),
      'sin-permiso',
    )
  })

  it('en plazo: devuelta, sin tardía, sin email, contador intacto y registro conservado (R12)', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const returned = await cicloPrestamo(familia, staff, '2026-09-01', '2026-09-15')

    expect(returned.status).toBe('devuelta')
    expect(returned.returnedLate).toBeFalsy()
    expect(day(returned.returnedAt)).toBe('2026-09-15')
    expect(emailsTo(familia.email)).toHaveLength(0)

    const after = await userDoc(familia.id)
    expect(after.lateReturnsCount ?? 0).toBe(0)

    const kept = await payload.findByID({ collection: 'reservation', id: returned.id })
    expect(kept.id).toBe(returned.id)
  })

  it('devolver el mismo día del vencimiento no es tardía', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const returned = await cicloPrestamo(familia, staff, '2026-09-01', '2026-09-29')

    expect(returned.returnedLate).toBeFalsy()
    expect(emailsTo(familia.email)).toHaveLength(0)
  })

  it('una reserva sin recoger no se devuelve', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })

    await expectLoanError(
      registerReturn({ payload, user: staff, reservationId: r.id, now: at('2026-09-15') }),
      'transicion-invalida',
    )
  })
})

describe('W7 — devolución tardía y penalización', () => {
  it('tardía: marca, email M2 a la familia y contador +1', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const returned = await cicloPrestamo(familia, staff, '2026-09-01', '2026-10-06')

    expect(returned.returnedLate).toBe(true)
    const mails = emailsTo(familia.email)
    expect(mails).toHaveLength(1)
    expect(bodyOf(mails[0]!)).toContain(LATE_RETURN_MESSAGE)

    const after = await userDoc(familia.id)
    expect(after.lateReturnsCount).toBe(1)
    expect(after.penalizedUntil ?? null).toBeNull()
  })

  it('la 2ª tardía aún no penaliza; la 3ª activa 6 meses; la 4ª renueva', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)

    await cicloPrestamo(familia, staff, '2026-09-01', '2026-10-06')
    await cicloPrestamo(familia, staff, '2026-10-06', '2026-11-10')
    let doc = await userDoc(familia.id)
    expect(doc.lateReturnsCount).toBe(2)
    expect(doc.penalizedUntil ?? null).toBeNull()

    await cicloPrestamo(familia, staff, '2026-11-10', '2026-12-15')
    doc = await userDoc(familia.id)
    expect(doc.lateReturnsCount).toBe(3)
    expect(day(doc.penalizedUntil)).toBe('2027-06-15')

    // 4ª tardía: el préstamo nace penalizado (14 días) y renueva la penalización
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-12-15') })
    const active = await registerPickup({
      payload,
      user: staff,
      reservationId: r.id,
      now: at('2026-12-15'),
    })
    expect(day(active.dueDate)).toBe('2026-12-29')
    await registerReturn({ payload, user: staff, reservationId: r.id, now: at('2027-01-05') })

    doc = await userDoc(familia.id)
    expect(doc.lateReturnsCount).toBe(4)
    expect(day(doc.penalizedUntil)).toBe('2027-07-05')
  })
})
