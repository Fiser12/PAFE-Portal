/** W9 — Pérdida/rotura y reposición: M3, plazo de 1 mes, stock comprometido (R10/A2) */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem, createStaff } from './helpers/factory'
import { expectLoanError } from './helpers/asserts'
import { at, day } from './helpers/dates'
import { bodyOf, emailsTo, resetEmails } from './helpers/email'
import { LOSS_MESSAGE } from '@/modules/catalog/domain/messages'
import {
  registerPickup,
  registerReplacement,
  reportLoss,
  reserveItem,
} from '@/modules/catalog/services'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(resetEmails)

/** Préstamo activo sobre un item de 1 ejemplar */
const prestamoActivo = async () => {
  const familia = await createFamilia(payload)
  const staff = await createStaff(payload)
  const item = await createItem(payload, { quantity: 1 })
  const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })
  const active = await registerPickup({
    payload,
    user: staff,
    reservationId: r.id,
    now: at('2026-09-01'),
  })
  return { familia, staff, item, loan: active }
}

describe('W9 — pérdida y reposición', () => {
  it('la familia no puede marcar pérdidas ni reposiciones', async () => {
    const { familia, loan } = await prestamoActivo()
    await expectLoanError(
      reportLoss({ payload, user: familia, reservationId: loan.id, now: at('2026-09-15') }),
      'sin-permiso',
    )
    await expectLoanError(
      registerReplacement({ payload, user: familia, reservationId: loan.id, now: at('2026-10-01') }),
      'sin-permiso',
    )
  })

  it('marca la pérdida: estado, fecha, límite de reposición +1 mes y email M3', async () => {
    const { familia, staff, loan } = await prestamoActivo()

    const lost = await reportLoss({
      payload,
      user: staff,
      reservationId: loan.id,
      now: at('2026-09-15'),
    })
    expect(lost.status).toBe('perdida')
    expect(day(lost.loss?.reportedAt)).toBe('2026-09-15')
    expect(day(lost.loss?.replacementDeadline)).toBe('2026-10-15')

    const mails = emailsTo(familia.email)
    expect(mails).toHaveLength(1)
    expect(bodyOf(mails[0]!)).toContain(LOSS_MESSAGE)
  })

  it('la pérdida no cuenta como devolución tardía (A2)', async () => {
    const { familia, staff, loan } = await prestamoActivo()
    await reportLoss({ payload, user: staff, reservationId: loan.id, now: at('2026-11-15') })

    const doc = await payload.findByID({
      collection: 'users',
      id: familia.id,
      overrideAccess: true,
    })
    expect(doc.lateReturnsCount ?? 0).toBe(0)
  })

  it('el ejemplar perdido sigue comprometido hasta la reposición', async () => {
    const { staff, item, loan } = await prestamoActivo()
    await reportLoss({ payload, user: staff, reservationId: loan.id, now: at('2026-09-15') })

    const otra = await createFamilia(payload)
    await expectLoanError(
      reserveItem({ payload, user: otra, itemId: item.id, now: at('2026-09-16') }),
      'sin-stock',
    )

    const replaced = await registerReplacement({
      payload,
      user: staff,
      reservationId: loan.id,
      now: at('2026-10-01'),
    })
    expect(day(replaced.loss?.replacedAt)).toBe('2026-10-01')

    const again = await reserveItem({
      payload,
      user: otra,
      itemId: item.id,
      now: at('2026-10-02'),
    })
    expect(again.status).toBe('reservada')
  })

  it('la reposición también libera el cupo de la familia', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const [a, b, c] = await Promise.all([
      createItem(payload),
      createItem(payload),
      createItem(payload),
    ])
    const ra = await reserveItem({ payload, user: familia, itemId: a.id, now: at('2026-08-27') })
    await registerPickup({ payload, user: staff, reservationId: ra.id, now: at('2026-09-01') })
    await reportLoss({ payload, user: staff, reservationId: ra.id, now: at('2026-09-15') })
    await reserveItem({ payload, user: familia, itemId: b.id, now: at('2026-09-16') })

    await expectLoanError(
      reserveItem({ payload, user: familia, itemId: c.id, now: at('2026-09-17') }),
      'cupo-lleno',
    )

    await registerReplacement({ payload, user: staff, reservationId: ra.id, now: at('2026-10-01') })
    const rc = await reserveItem({ payload, user: familia, itemId: c.id, now: at('2026-10-02') })
    expect(rc.status).toBe('reservada')
  })

  it('solo un préstamo activo puede perderse', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const item = await createItem(payload)
    const r = await reserveItem({ payload, user: familia, itemId: item.id, now: at('2026-08-27') })

    await expectLoanError(
      reportLoss({ payload, user: staff, reservationId: r.id, now: at('2026-09-15') }),
      'transicion-invalida',
    )
  })
})
