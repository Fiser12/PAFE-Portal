/**
 * Smoke del arnés: DEBE ESTAR EN VERDE desde el primer día, con el modelo
 * actual. Si esto falla, el rojo de los demás ficheros no es fiable.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createItem } from './helpers/factory'
import { resetEmails, sentEmails } from './helpers/email'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

describe('arnés vertical', () => {
  it('arranca Payload contra el Postgres efímero y crea entidades reales', async () => {
    const familia = await createFamilia(payload)
    const item = await createItem(payload, { quantity: 3 })

    expect(familia.id).toBeTruthy()
    expect(familia.role).toEqual(['familia'])
    expect(item.quantity).toBe(3)

    const reservation = await payload.create({
      collection: 'reservation',
      data: { item: item.id, user: familia.id, reservationDate: new Date().toISOString() },
      overrideAccess: true,
    })
    const found = await payload.findByID({ collection: 'reservation', id: reservation.id })
    expect(found.id).toBe(reservation.id)
  })

  it('captura los emails con el adapter de test', async () => {
    resetEmails()
    await payload.sendEmail({
      to: 'smoke@pafe.test',
      subject: 'smoke',
      html: '<p>smoke</p>',
    })
    expect(sentEmails).toHaveLength(1)
    expect(String(sentEmails[0]!.to)).toContain('smoke@pafe.test')
  })
})
