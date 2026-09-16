/** T9: un área restringida solo la ven y la reciben los del grupo */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createStaff, createUser, meterEnGrupo } from './helpers/factory'
import { at } from './helpers/dates'
import { emailsTo, resetEmails } from './helpers/email'
import { userNotifications } from '@/modules/catalog/services'
import { noticiaDelTablon, noticiasDelTablon, publicarNoticia } from '@/modules/tablon/services'
import { GRUPO_LANTALDE } from '@/modules/tablon/domain/areas'

const RESTRINGIDA = 'lantalde-teknikoa'
const ABIERTA = 'berriak-pafe'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  resetEmails()
  await payload.delete({ collection: 'noticia', where: {}, overrideAccess: true })
})

/** El grupo del área restringida, creado con el nombre que la vincula */
const grupoDelArea = async () => {
  const existente = await payload.find({
    collection: 'groups',
    where: { name: { equals: GRUPO_LANTALDE } },
    limit: 1,
    overrideAccess: true,
  })
  if (existente.docs[0]) return existente.docs[0]
  return payload.create({
    collection: 'groups',
    data: { name: GRUPO_LANTALDE },
    overrideAccess: true,
  })
}

const titulos = async (user: Awaited<ReturnType<typeof createFamilia>>, area?: string) =>
  (await noticiasDelTablon({ payload, user, area, now: at('2026-09-20') })).map((n) => n.title)

describe('el área del equipo técnico', () => {
  it('no la ve quien no está en el grupo', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await grupoDelArea()

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Solo para el equipo técnico',
      body: '.',
      area: RESTRINGIDA,
      now: at('2026-09-16'),
    })

    expect(await titulos(familia)).not.toContain('Solo para el equipo técnico')
  })

  it('sí la ve quien está en el grupo', async () => {
    const staff = await createStaff(payload)
    const tecnica = await createFamilia(payload)
    const grupo = await grupoDelArea()
    await meterEnGrupo(payload, tecnica.id, grupo.id)

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Solo para el equipo técnico',
      body: '.',
      area: RESTRINGIDA,
      now: at('2026-09-16'),
    })

    const conGrupo = await payload.findByID({ collection: 'users', id: tecnica.id, overrideAccess: true })
    expect(await titulos(conGrupo)).toContain('Solo para el equipo técnico')
  })

  it('no se abre por su URL si no estás en el grupo', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await grupoDelArea()

    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Reservada',
      body: '.',
      area: RESTRINGIDA,
      now: at('2026-09-16'),
    })

    const abierta = await noticiaDelTablon({
      payload,
      user: familia,
      id: noticia.id,
      now: at('2026-09-20'),
    })
    expect(abierta).toBeNull()
  })

  it('publicar en el área del equipo técnico no avisa a las familias', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await grupoDelArea()

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Aviso del equipo técnico',
      body: '.',
      area: RESTRINGIDA,
      now: at('2026-09-16'),
    })

    const avisos = (await userNotifications({ payload, userId: Number(familia.id) })).filter(
      (n) => n.type === 'noticia',
    )
    expect(avisos).toHaveLength(0)
    expect(emailsTo(familia.email)).toHaveLength(0)
  })

  it('las áreas abiertas las sigue viendo todo el mundo', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Para todos',
      body: '.',
      area: ABIERTA,
      now: at('2026-09-16'),
    })

    expect(await titulos(familia)).toContain('Para todos')
  })

  it('el staff sí ve el área restringida, esté o no en el grupo', async () => {
    const staff = await createStaff(payload)
    const otroStaff = await createUser(payload, ['admin-news'], 'Tablón Test')
    await grupoDelArea()

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Lo que publica el equipo',
      body: '.',
      area: RESTRINGIDA,
      now: at('2026-09-16'),
    })

    expect(await titulos(otroStaff)).toContain('Lo que publica el equipo')
  })
})
