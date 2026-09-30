/** T14: lo que Alberto no encontraba en el foro: archivar, editar y meter imágenes o adjuntos */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import { moderacionPara } from '@/modules/tablon/domain/moderacion'
import { AREAS_DEL_TABLON, aspectoDelArea } from '@/modules/tablon/domain/areas'
import { noticiasDelTablon, publicarNoticia, responder } from '@/modules/tablon/services'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createStaff, createUser } from './helpers/factory'
import { at } from './helpers/dates'

let payload: Payload
let alberto: User

beforeAll(async () => {
  payload = await getTestPayload()
  alberto = await createUser(payload, ['admin', 'admin-news'], 'Alberto')
})

describe('qué puede hacer cada cual con una noticia desde el foro', () => {
  const conRol = (...role: string[]) => ({ id: 1, email: 'x@pafe.test', role })

  it('administración archiva y edita', () => {
    expect(moderacionPara(conRol('admin'))).toEqual({ archivar: true, editar: true })
  })

  it('un psicólogo archiva, pero no edita desde el panel, que no es suyo', () => {
    expect(moderacionPara(conRol('profesional'))).toEqual({ archivar: true, editar: false })
  })

  it('una familia no modera nada', () => {
    expect(moderacionPara(conRol('familia'))).toEqual({ archivar: false, editar: false })
  })
})

describe('editar desde el panel una noticia que vino del foro antiguo', () => {
  const importada = () =>
    payload.create({
      collection: 'noticia',
      data: {
        title: 'Tema importado',
        area: 'berriak-pafe',
        publishedAt: '2026-09-01T10:00:00.000Z',
        sourceTopicId: Math.floor(Math.random() * 1_000_000_000),
        sourceAuthor: 'Autor antiguo',
      },
      overrideAccess: true,
      context: { saltarAvisoDelTablon: true },
    })

  const comoElPanel = (id: number | string, data: Record<string, unknown>) =>
    payload.update({
      collection: 'noticia',
      id,
      data,
      user: alberto,
      overrideAccess: false,
      req: { payloadAPI: 'REST' },
    })

  it('se cambia el título', async () => {
    const noticia = await importada()
    expect((await comoElPanel(noticia.id, { title: 'Título nuevo' })).title).toBe('Título nuevo')
  })

  it('se archiva', async () => {
    const noticia = await importada()
    expect((await comoElPanel(noticia.id, { archivada: true })).archivada).toBe(true)
  })

  it('se mueve a otra área', async () => {
    const noticia = await importada()
    expect((await comoElPanel(noticia.id, { area: 'ia' })).area).toBe('ia')
  })
})

describe('el editor de noticias deja meter imágenes y adjuntos a la vista', () => {
  const rasgosDelEditor = () => {
    const cuerpo = payload.collections.noticia.config.fields.find(
      (field) => 'name' in field && field.name === 'body',
    ) as { editor?: { editorConfig?: { resolvedFeatureMap?: Map<string, unknown> } } }
    return [...(cuerpo.editor?.editorConfig?.resolvedFeatureMap?.keys() ?? [])]
  }

  it('lleva una barra fija con el botón de insertar', () => {
    expect(rasgosDelEditor()).toEqual(expect.arrayContaining(['toolbarFixed', 'upload']))
  })

  it('y la barra flotante para dar formato al texto seleccionado', () => {
    expect(rasgosDelEditor()).toContain('toolbarInline')
  })

  it('al subir un adjunto nuevo no se enseña el origen de la importación', () => {
    const campo = payload.collections.adjunto.config.fields.find(
      (field) => 'name' in field && field.name === 'sourceKey',
    ) as { admin?: { condition?: (data: Record<string, unknown>) => boolean } }
    expect(campo.admin?.condition?.({})).toBe(false)
    expect(campo.admin?.condition?.({ sourceKey: 'nodebb:1' })).toBe(true)
  })

  it('en una noticia nueva tampoco salen los datos del foro antiguo', () => {
    for (const nombre of ['sourceTopicId', 'sourceAuthor', 'sourceAuthorId']) {
      const campo = payload.collections.noticia.config.fields.find(
        (field) => 'name' in field && field.name === nombre,
      ) as { admin?: { condition?: (data: Record<string, unknown>) => boolean } }
      expect(campo.admin?.condition?.({})).toBe(false)
      expect(campo.admin?.condition?.({ [nombre]: 7 })).toBe(true)
    }
  })
})

describe('Sugerencias del portal', () => {
  it('es un área del foro, con su color', () => {
    expect(AREAS_DEL_TABLON.map((a) => a.value)).toContain('sugerencias-del-portal')
    expect(aspectoDelArea('sugerencias-del-portal')).toMatchObject({ icono: 'bombilla' })
  })

  it('la ven las familias y pueden responder', async () => {
    const staff = await createStaff(payload)
    const familia = await createFamilia(payload)
    const tema = await publicarNoticia({
      payload,
      user: staff,
      title: '¿Qué mejorarías del portal?',
      body: 'Contadnos',
      area: 'sugerencias-del-portal',
      now: at('2026-09-30'),
    })

    const visibles = await noticiasDelTablon({ payload, user: familia, now: at('2026-10-01') })
    expect(visibles.map((n) => n.title)).toContain('¿Qué mejorarías del portal?')

    const respuesta = await responder({
      payload,
      user: familia,
      noticiaId: Number(tema.id),
      mensaje: 'Que el calendario se vea en el móvil',
    })
    expect(respuesta.id).toBeTruthy()
  })
})
