/** T17: una noticia recién subida se ve en el momento, no a las 14:00 */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import { noticiasDelTablon } from '@/modules/tablon/services'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createUser } from './helpers/factory'

let payload: Payload
let alberto: User

beforeAll(async () => {
  payload = await getTestPayload()
  alberto = await createUser(payload, ['admin', 'admin-news'], 'Alberto')
})

const campoFecha = () => {
  const campo = payload.collections.noticia.config.fields.find(
    (field) => 'name' in field && field.name === 'publishedAt',
  )
  if (!campo || campo.type !== 'date') throw new Error('la noticia no tiene fecha de publicación')
  return campo
}

/** Lo que el panel pone en el formulario de una noticia nueva */
const fechaPropuesta = (): string => {
  const { defaultValue } = campoFecha()
  if (typeof defaultValue !== 'function') throw new Error('la fecha no se rellena sola')
  return defaultValue({} as never) as string
}

describe('la fecha de publicación de una noticia', () => {
  it('viene puesta con el momento en que se crea', () => {
    expect(Math.abs(new Date(fechaPropuesta()).getTime() - Date.now())).toBeLessThan(5_000)
  })

  it('se elige con día y hora, para que se vea a qué hora sale', () => {
    expect(campoFecha().admin?.date?.pickerAppearance).toBe('dayAndTime')
  })

  it('una noticia subida desde el panel sin tocar la fecha sale ya en el tablón', async () => {
    const noticia = await payload.create({
      collection: 'noticia',
      data: { title: 'Recién subida', area: 'berriak-pafe', publishedAt: fechaPropuesta() },
      user: alberto,
      overrideAccess: false,
      context: { saltarAvisoDelTablon: true },
    })
    const familia = await createFamilia(payload)

    const visibles = await noticiasDelTablon({ payload, user: familia, now: new Date() })

    expect(visibles.map((n) => n.id)).toContain(noticia.id)
  })
})
