import { beforeAll, describe, expect, it } from 'vitest'
import { editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createStaff, meterEnGrupo } from './helpers/factory'
import { sentEmails, resetEmails } from './helpers/email'
import { avisarDeNoticiasPendientes, responder } from '@/modules/tablon/services'
import { GRUPO_LANTALDE } from '@/modules/tablon/domain/areas'
import { transformHTML } from '../../scripts/nodebb/transform.mjs'

let payload: Payload
beforeAll(async () => {
  payload = await getTestPayload()
})

describe('migración de NodeBB', () => {
  it('protege noticias, respuestas y adjuntos técnicos también por acceso de colección', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const noticia = await payload.create({
      collection: 'noticia',
      data: {
        title: 'Técnica',
        area: 'lantalde-teknikoa',
        publishedAt: '2025-01-01',
        notifiedAt: '2025-01-01',
      },
    })
    const respuesta = await payload.create({
      collection: 'respuesta',
      data: {
        mensaje: 'Respuesta histórica',
        noticia: noticia.id,
        sourceAuthor: 'Autora anterior',
        sourcePostId: 90001,
      },
    })
    const adjunto = await payload.create({
      collection: 'adjunto',
      data: { area: 'lantalde-teknikoa' },
      file: {
        data: Buffer.from('documento técnico'),
        name: 'tecnico.txt',
        mimetype: 'text/plain',
        size: Buffer.byteLength('documento técnico'),
      },
    })
    for (const [collection, id] of [
      ['noticia', noticia.id],
      ['respuesta', respuesta.id],
      ['adjunto', adjunto.id],
    ] as const) {
      const hidden = await payload.find({
        collection,
        where: { id: { equals: id } },
        user: familia,
        overrideAccess: false,
      })
      expect(hidden.docs).toHaveLength(0)
      const allowed = await payload.find({
        collection,
        where: { id: { equals: id } },
        user: staff,
        overrideAccess: false,
      })
      expect(allowed.docs).toHaveLength(1)
    }
    const group =
      (await payload.find({ collection: 'groups', where: { name: { equals: GRUPO_LANTALDE } } }))
        .docs[0] ?? (await payload.create({ collection: 'groups', data: { name: GRUPO_LANTALDE } }))
    await meterEnGrupo(payload, familia.id, group.id)
    const member = await payload.findByID({ collection: 'users', id: familia.id, depth: 0 })
    expect(
      (
        await payload.find({
          collection: 'respuesta',
          where: { id: { equals: respuesta.id } },
          user: member,
          overrideAccess: false,
        })
      ).docs,
    ).toHaveLength(1)
  })

  it('conserva autoría sin crear cuentas, no avisa y mantiene los temas cerrados', async () => {
    const familia = await createFamilia(payload)
    resetEmails()
    const noticia = await payload.create({
      collection: 'noticia',
      context: { saltarAvisoDelTablon: true },
      data: {
        title: 'Histórica',
        area: 'berriak-pafe',
        sourceTopicId: 90001,
        sourceAuthor: 'Usuario eliminado',
        publishedAt: '2024-01-01T00:00:00Z',
        notifiedAt: '2026-09-23T00:00:00Z',
        archivada: true,
        cerrada: true,
      },
    })
    const notifications = (await payload.count({ collection: 'notification' })).totalDocs
    await avisarDeNoticiasPendientes({ payload, now: new Date() })
    expect((await payload.count({ collection: 'notification' })).totalDocs).toBe(notifications)
    expect(sentEmails).toHaveLength(0)
    await expect(
      responder({ payload, user: familia, noticiaId: noticia.id, mensaje: 'Nueva' }),
    ).rejects.toMatchObject({ code: 'sin-permiso' })
    await expect(
      payload.create({
        collection: 'respuesta',
        overrideAccess: false,
        user: familia,
        data: { noticia: noticia.id, author: familia.id, mensaje: 'Nueva' },
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'noticia',
        data: {
          title: 'Duplicada',
          sourceTopicId: 90001,
          area: 'ia',
          publishedAt: '2024-01-01',
          notifiedAt: '2024-01-01',
        },
      }),
    ).rejects.toThrow()
  })

  it('rechaza autorías falsificadas y respuestas a áreas ajenas por la API', async () => {
    const familia = await createFamilia(payload)
    const staff = await createStaff(payload)
    const noticia = await payload.create({
      collection: 'noticia',
      data: {
        title: 'Privada',
        area: 'lantalde-teknikoa',
        publishedAt: '2024-01-01',
        notifiedAt: '2024-01-01',
      },
    })
    await expect(
      payload.create({
        collection: 'respuesta',
        overrideAccess: false,
        user: familia,
        data: { noticia: noticia.id, author: familia.id, mensaje: 'Sin acceso' },
      }),
    ).rejects.toThrow()
    await payload.update({ collection: 'noticia', id: noticia.id, data: { area: 'ia' } })
    await expect(
      payload.create({
        collection: 'respuesta',
        overrideAccess: false,
        user: familia,
        data: { noticia: noticia.id, author: staff.id, mensaje: 'Falsa' },
      }),
    ).rejects.toThrow()
    const own = await payload.create({
      collection: 'respuesta',
      overrideAccess: false,
      user: familia,
      depth: 0,
      data: { noticia: noticia.id, author: familia.id, mensaje: 'Propia' },
    })
    expect(own.author).toBe(familia.id)
  })

  it('conserva texto, listas, enlaces e imágenes; bloquea URLs ejecutables', () => {
    const field = payload.config.collections
      .find((c) => c.slug === 'noticia')
      ?.fields.find((f) => 'name' in f && f.name === 'body')
    if (!field || field.type !== 'richText') throw new Error('Missing body field')
    const result = transformHTML({
      html: '<p>Kaixo <strong>mundo</strong><a>ancla</a></p><ol><li>Uno</li></ol><p><img src="/assets/uploads/files/test.png" alt="Prueba"></p><p><a href="/post/4">Respuesta</a><a href="javascript:alert(1)">Seguro</a></p>',
      area: 'ia',
      assets: new Map([
        [
          'ia:https://foro.pafe-formakuntza.com/assets/uploads/files/test.png',
          { id: 1, filename: 'test.png' },
        ],
      ]),
      topics: new Map(),
      posts: new Map([[4, '/noticias/2#respuesta-3']]),
      editorConfig: editorConfigFactory.fromField({ field }),
    })
    const encoded = JSON.stringify(result)
    expect(encoded).toContain('mundo')
    expect(encoded).toContain('listitem')
    expect(encoded).toContain('"type":"upload"')
    expect(encoded).toContain('/noticias/2#respuesta-3')
    expect(encoded).not.toContain('javascript:')
    expect(encoded).not.toContain('NODEBBIMAGE')
    expect(() =>
      transformHTML({
        html: '<a href="/assets/uploads/files/missing.pdf">Documento</a>',
        area: 'ia',
        assets: new Map(),
        topics: new Map(),
        posts: new Map(),
        editorConfig: editorConfigFactory.fromField({ field }),
      }),
    ).toThrow('Missing imported attachment')
  })
})
