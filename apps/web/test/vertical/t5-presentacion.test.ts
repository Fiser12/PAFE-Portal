/** T8: el texto de presentación del catálogo lo edita quien lleva el catálogo */
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload } from './helpers/payload'
import { createFamilia, createUser } from './helpers/factory'
import { textoDePresentacion } from '@/modules/catalog/services/presentacion'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

const escribir = (texto: string) => ({
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: texto }] },
    ],
    direction: null,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

describe('presentación del catálogo', () => {
  it('trae un texto de salida aunque nadie lo haya tocado', async () => {
    const texto = await textoDePresentacion(payload)
    expect(texto).not.toBeNull()
  })

  it('quien lleva el catálogo puede cambiarlo', async () => {
    const user = await createUser(payload, ['admin-catalogo'], 'Catálogo Test')

    await payload.updateGlobal({
      slug: 'presentacion-catalogo',
      data: { texto: escribir('Texto nuevo del catálogo') },
      user,
      overrideAccess: false,
    })

    const texto = await textoDePresentacion(payload)
    expect(JSON.stringify(texto)).toContain('Texto nuevo del catálogo')
  })

  it('una familia no puede cambiarlo', async () => {
    const familia = await createFamilia(payload)

    await expect(
      payload.updateGlobal({
        slug: 'presentacion-catalogo',
        data: { texto: escribir('No debería') },
        user: familia,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('quien publica en el tablón tampoco', async () => {
    const user = await createUser(payload, ['admin-news'], 'Tablón Test')

    await expect(
      payload.updateGlobal({
        slug: 'presentacion-catalogo',
        data: { texto: escribir('No debería') },
        user,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('la presentación en dos idiomas', () => {
  it('guarda un texto distinto en cada idioma', async () => {
    const user = await createUser(payload, ['admin-catalogo'], 'Catálogo Test')

    await payload.updateGlobal({
      slug: 'presentacion-catalogo',
      data: { texto: escribir('Bienvenida en castellano') },
      locale: 'es',
      user,
      overrideAccess: false,
    })
    await payload.updateGlobal({
      slug: 'presentacion-catalogo',
      data: { texto: escribir('Ongietorria euskaraz') },
      locale: 'eu',
      user,
      overrideAccess: false,
    })

    expect(JSON.stringify(await textoDePresentacion(payload, 'es'))).toContain(
      'Bienvenida en castellano',
    )
    expect(JSON.stringify(await textoDePresentacion(payload, 'eu'))).toContain(
      'Ongietorria euskaraz',
    )
  })

  it('si el euskera está sin escribir, se lee el castellano', async () => {
    const user = await createUser(payload, ['admin-catalogo'], 'Catálogo Test')

    await payload.updateGlobal({
      slug: 'presentacion-catalogo',
      data: { texto: escribir('Solo en castellano') },
      locale: 'es',
      user,
      overrideAccess: false,
    })
    await payload.updateGlobal({
      slug: 'presentacion-catalogo',
      data: { texto: null },
      locale: 'eu',
      user,
      overrideAccess: false,
    })

    expect(JSON.stringify(await textoDePresentacion(payload, 'eu'))).toContain('Solo en castellano')
  })
})
