/** T3/T4: a quién avisa una noticia nueva. Reglas R5, R7, R8, R9 de la spec */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createStaff } from './helpers/factory'
import { at } from './helpers/dates'
import { emailFailures, emailsTo, resetEmails } from './helpers/email'
import { userNotifications } from '@/modules/catalog/services'
import {
  avisarDeNoticia,
  editarNoticia,
  elegirAreas,
  publicarNoticia,
} from '@/modules/tablon/services'

const AREA = 'avisos'
const OTRA = 'formacion'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(resetEmails)

const avisos = async (userId: number) =>
  (await userNotifications({ payload, userId })).filter((n) => n.type === 'noticia')

describe('avisos de una noticia nueva', () => {
  it('avisa a quien está suscrito al área y no a los demás', async () => {
    const staff = await createStaff(payload)
    const suscrita = await createFamilia(payload)
    const ajena = await createFamilia(payload)
    
    await elegirAreas({ payload, user: suscrita, areas: [AREA] })

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Cambio de aula',
      body: 'Nos movemos a la sala grande.',
      area: AREA,
      now: at('2026-09-16'),
    })

    expect(await avisos(Number(suscrita.id))).toHaveLength(1)
    expect(await avisos(Number(ajena.id))).toHaveLength(0)
  })

  it('el aviso lleva el título de la noticia', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Cambio de aula',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    const [aviso] = await avisos(Number(familia.id))
    expect(aviso!.message).toContain('Cambio de aula')
  })

  it('manda correo a quien está suscrito', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Nueva guía de acogida',
      body: 'Ya está publicada.',
      area: AREA,
      now: at('2026-09-16'),
    })

    expect(emailsTo(familia.email)).toHaveLength(1)
  })

  it('no se avisa a quien la publica, aunque esté suscrito', async () => {
    const staff = await createStaff(payload)
    await elegirAreas({ payload, user: staff, areas: [AREA] })

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Aviso propio',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    expect(await avisos(Number(staff.id))).toHaveLength(0)
  })

  it('editar una noticia no vuelve a avisar', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })

    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Con erratas',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })
    await editarNoticia({
      payload,
      user: staff,
      noticiaId: Number(noticia.id),
      title: 'Sin erratas',
    })

    expect(await avisos(Number(familia.id))).toHaveLength(1)
  })

  it('una noticia con fecha futura no avisa todavía', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Todavía no',
      body: '.',
      area: AREA,
      publishedAt: at('2026-10-30').toISOString(),
      now: at('2026-09-16'),
    })

    expect(await avisos(Number(familia.id))).toHaveLength(0)
    expect(emailsTo(familia.email)).toHaveLength(0)
  })

  it('si falla el correo, el aviso de la campana sigue ahí', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })
    emailFailures.failNextSend = true

    await publicarNoticia({
      payload,
      user: staff,
      title: 'El correo se cae',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    expect(await avisos(Number(familia.id))).toHaveLength(1)
  })

  it('publicar desde el panel también avisa, sin pasar por el servicio', async () => {
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })

    // Tal cual lo hace el panel de Payload: create directo sobre la colección
    await payload.create({
      collection: 'noticia',
      data: {
        title: 'Publicada desde el panel',
        area: AREA,
        publishedAt: at('2026-09-16').toISOString(),
      },
      overrideAccess: true,
    })

    expect(await avisos(Number(familia.id))).toHaveLength(1)
    expect(emailsTo(familia.email)).toHaveLength(1)
  })

  it('suscribirse a algo que no es un área del tablón no cuenta', async () => {
    const familia = await createFamilia(payload)

    await elegirAreas({ payload, user: familia, areas: [AREA, 'inventada'] })

    const guardado = await payload.findByID({
      collection: 'users',
      id: familia.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(guardado.areasSuscritas).toEqual([AREA])
  })

  it('quien se da de baja de un área deja de recibir avisos', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })
    await elegirAreas({ payload, user: familia, areas: [] })

    await publicarNoticia({
      payload,
      user: staff,
      title: 'Ya no me interesa',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    expect(await avisos(Number(familia.id))).toHaveLength(0)
  })
})

describe('reintentos: avisar dos veces no molesta dos veces', () => {
  it('volver a avisar de la misma noticia no duplica el aviso', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    await elegirAreas({ payload, user: familia, areas: [AREA] })

    const noticia = await publicarNoticia({
      payload,
      user: staff,
      title: 'Solo una vez',
      body: '.',
      area: AREA,
      now: at('2026-09-16'),
    })

    // Lo que hace el cron si un fallo a mitad dejó la noticia sin marcar
    await avisarDeNoticia({ payload, noticia })

    expect(await avisos(Number(familia.id))).toHaveLength(1)
  })
})
