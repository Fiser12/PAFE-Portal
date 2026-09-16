/** T10: responder a una noticia del tablón */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createPendiente, createStaff, meterEnGrupo } from './helpers/factory'
import { at } from './helpers/dates'
import { GRUPO_LANTALDE } from '@/modules/tablon/domain/areas'
import {
  borrarRespuesta,
  editarRespuesta,
  publicarNoticia,
  responder,
  respuestasDe,
} from '@/modules/tablon/services'

const AREA = 'berriak-pafe' as const
const RESTRINGIDA = 'lantalde-teknikoa' as const

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

beforeEach(async () => {
  await payload.delete({ collection: 'noticia', where: {}, overrideAccess: true })
})

const unaNoticia = async (area: typeof AREA | typeof RESTRINGIDA = AREA) => {
  const staff = await createStaff(payload)
  return publicarNoticia({
    payload,
    user: staff,
    title: 'Para responder',
    body: '.',
    area,
    now: at('2026-09-16'),
  })
}

const grupoTecnico = async () => {
  const existente = await payload.find({
    collection: 'groups',
    where: { name: { equals: GRUPO_LANTALDE } },
    limit: 1,
    overrideAccess: true,
  })
  return (
    existente.docs[0] ??
    (await payload.create({
      collection: 'groups',
      data: { name: GRUPO_LANTALDE },
      overrideAccess: true,
    }))
  )
}

describe('responder a una noticia', () => {
  it('una familia responde y su mensaje aparece', async () => {
    const noticia = await unaNoticia()
    const familia = await createFamilia(payload)

    await responder({
      payload,
      user: familia,
      noticiaId: Number(noticia.id),
      mensaje: 'Nos viene bien la nueva hora',
    })

    const respuestas = await respuestasDe({ payload, user: familia, noticiaId: Number(noticia.id) })
    expect(respuestas).toHaveLength(1)
    expect(respuestas[0]!.mensaje).toBe('Nos viene bien la nueva hora')
  })

  it('salen en el orden en que se escribieron', async () => {
    const noticia = await unaNoticia()
    const una = await createFamilia(payload)
    const otra = await createFamilia(payload)

    await responder({ payload, user: una, noticiaId: Number(noticia.id), mensaje: 'Primera' })
    await responder({ payload, user: otra, noticiaId: Number(noticia.id), mensaje: 'Segunda' })

    const respuestas = await respuestasDe({ payload, user: una, noticiaId: Number(noticia.id) })
    expect(respuestas.map((r) => r.mensaje)).toEqual(['Primera', 'Segunda'])
  })

  it('quien no tiene rol no puede responder', async () => {
    const noticia = await unaNoticia()
    const pendiente = await createPendiente(payload)

    await expect(
      responder({ payload, user: pendiente, noticiaId: Number(noticia.id), mensaje: 'Hola' }),
    ).rejects.toMatchObject({ code: 'sin-permiso' })
  })

  it('no se puede responder a una noticia que no puedes ver', async () => {
    const noticia = await unaNoticia(RESTRINGIDA)
    await grupoTecnico()
    const familia = await createFamilia(payload)

    await expect(
      responder({ payload, user: familia, noticiaId: Number(noticia.id), mensaje: 'Cotilleo' }),
    ).rejects.toMatchObject({ code: 'noticia-no-encontrada' })
  })

  it('quien está en el grupo sí puede responder ahí', async () => {
    const noticia = await unaNoticia(RESTRINGIDA)
    const grupo = await grupoTecnico()
    const tecnica = await createFamilia(payload)
    await meterEnGrupo(payload, tecnica.id, grupo.id)
    const conGrupo = await payload.findByID({
      collection: 'users',
      id: tecnica.id,
      overrideAccess: true,
    })

    const respuesta = await responder({
      payload,
      user: conGrupo,
      noticiaId: Number(noticia.id),
      mensaje: 'Recibido',
    })
    expect(respuesta.mensaje).toBe('Recibido')
  })

  it('un mensaje vacío no vale', async () => {
    const noticia = await unaNoticia()
    const familia = await createFamilia(payload)

    await expect(
      responder({ payload, user: familia, noticiaId: Number(noticia.id), mensaje: '   ' }),
    ).rejects.toMatchObject({ code: 'mensaje-vacio' })
  })
})

describe('corregir o retirar una respuesta', () => {
  it('quien la escribió puede corregirla', async () => {
    const noticia = await unaNoticia()
    const familia = await createFamilia(payload)
    const respuesta = await responder({
      payload,
      user: familia,
      noticiaId: Number(noticia.id),
      mensaje: 'Con erratas',
    })

    const corregida = await editarRespuesta({
      payload,
      user: familia,
      respuestaId: Number(respuesta.id),
      mensaje: 'Sin erratas',
    })
    expect(corregida.mensaje).toBe('Sin erratas')
  })

  it('otra persona no puede tocarla', async () => {
    const noticia = await unaNoticia()
    const autora = await createFamilia(payload)
    const ajena = await createFamilia(payload)
    const respuesta = await responder({
      payload,
      user: autora,
      noticiaId: Number(noticia.id),
      mensaje: 'Mía',
    })

    await expect(
      editarRespuesta({
        payload,
        user: ajena,
        respuestaId: Number(respuesta.id),
        mensaje: 'Secuestrada',
      }),
    ).rejects.toMatchObject({ code: 'sin-permiso' })
  })

  it('quien la escribió puede retirarla', async () => {
    const noticia = await unaNoticia()
    const familia = await createFamilia(payload)
    const respuesta = await responder({
      payload,
      user: familia,
      noticiaId: Number(noticia.id),
      mensaje: 'Me arrepiento',
    })

    await borrarRespuesta({ payload, user: familia, respuestaId: Number(respuesta.id) })

    expect(await respuestasDe({ payload, user: familia, noticiaId: Number(noticia.id) })).toHaveLength(0)
  })

  it('el staff puede retirar la de cualquiera', async () => {
    const noticia = await unaNoticia()
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const respuesta = await responder({
      payload,
      user: familia,
      noticiaId: Number(noticia.id),
      mensaje: 'Fuera de tono',
    })

    await borrarRespuesta({ payload, user: staff, respuestaId: Number(respuesta.id) })

    expect(await respuestasDe({ payload, user: staff, noticiaId: Number(noticia.id) })).toHaveLength(0)
  })
})

describe('retirar la noticia', () => {
  it('se lleva por delante lo que se respondió en ella', async () => {
    const noticia = await unaNoticia()
    const familia = await createFamilia(payload)
    await responder({ payload, user: familia, noticiaId: Number(noticia.id), mensaje: 'Aquí estoy' })

    await payload.delete({ collection: 'noticia', id: noticia.id, overrideAccess: true })

    const quedan = await payload.find({
      collection: 'respuesta',
      where: { noticia: { equals: noticia.id } },
      overrideAccess: true,
    })
    expect(quedan.totalDocs).toBe(0)
  })
})
