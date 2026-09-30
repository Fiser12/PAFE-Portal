/** T13: borrar una cuenta. Antes fallaba con cualquiera que tuviera acceso, reservas o avisos */
import { beforeAll, describe, expect, it } from 'vitest'
import type { User } from '@/payload-types'
import { NOTIFICATION_TYPES } from '@/modules/catalog/domain/notifications'
import { getTestPayload } from './helpers/payload'
import {
  asignarCaso,
  completarTarea,
  createCase,
  createItem,
  createTask,
  createUser,
} from './helpers/factory'

let payload: Awaited<ReturnType<typeof getTestPayload>>
let admin: User

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createUser(payload, ['admin'], 'Alberto')
})

const borrar = (id: number) =>
  payload.delete({
    collection: 'users',
    id,
    user: admin,
    overrideAccess: false,
    req: { payloadAPI: 'REST' },
  })

const conAcceso = async (user: User) => {
  const ahora = new Date().toISOString()
  await payload.create({
    collection: 'accounts',
    data: {
      accountId: String(user.id),
      providerId: 'credential',
      user: user.id,
      password: 'x',
      createdAt: ahora,
      updatedAt: ahora,
    },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'sessions',
    data: {
      token: `sesion-${user.id}-${Date.now()}`,
      user: user.id,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      createdAt: ahora,
      updatedAt: ahora,
    },
    overrideAccess: true,
  })
}

const reserva = async (user: User, status: 'reservada' | 'activa' | 'devuelta' | 'cancelada') => {
  const item = await createItem(payload)
  return payload.create({
    collection: 'reservation',
    data: { item: item.id, user: user.id, status, reservationDate: new Date().toISOString() },
    overrideAccess: true,
  })
}

const cuantas = async (
  collection: 'accounts' | 'sessions' | 'reservation' | 'notification' | 'tasks-completed',
  userId: number,
) =>
  (await payload.count({ collection, where: { user: { equals: userId } }, overrideAccess: true }))
    .totalDocs

const existe = async (id: number) =>
  (await payload.count({ collection: 'users', where: { id: { equals: id } }, overrideAccess: true }))
    .totalDocs === 1

describe('un admin borra una cuenta', () => {
  it('aunque tenga acceso con contraseña o Google y una sesión abierta', async () => {
    const familia = await createUser(payload, ['familia'])
    await conAcceso(familia)
    await borrar(familia.id)
    expect(await existe(familia.id)).toBe(false)
    expect(await cuantas('accounts', familia.id)).toBe(0)
    expect(await cuantas('sessions', familia.id)).toBe(0)
  })

  it('con su historial de préstamos cerrados, avisos y tareas hechas', async () => {
    const familia = await createUser(payload, ['familia'])
    await conAcceso(familia)
    await reserva(familia, 'devuelta')
    await reserva(familia, 'cancelada')
    await payload.create({
      collection: 'notification',
      data: { user: familia.id, type: NOTIFICATION_TYPES[0], message: 'aviso' },
      overrideAccess: true,
    })
    const caso = await createCase(payload)
    await asignarCaso(payload, familia.id, caso.id)
    const tarea = await createTask(payload, [caso.id])
    await completarTarea(payload, tarea.id, familia.id, new Date().toISOString())

    await borrar(familia.id)
    expect(await existe(familia.id)).toBe(false)
    expect(await cuantas('reservation', familia.id)).toBe(0)
    expect(await cuantas('notification', familia.id)).toBe(0)
    expect(await cuantas('tasks-completed', familia.id)).toBe(0)
  })

  it('con preferencias guardadas en el panel', async () => {
    const otroAdmin = await createUser(payload, ['admin'])
    await payload.create({
      collection: 'payload-preferences',
      data: {
        key: 'collection-users',
        value: { limit: 10 },
        user: { relationTo: 'users', value: otroAdmin.id },
      },
      user: { ...otroAdmin, collection: 'users' },
      overrideAccess: true,
    })
    await borrar(otroAdmin.id)
    expect(await existe(otroAdmin.id)).toBe(false)
  })
})

describe('lo que impide borrar una cuenta', () => {
  it.each(['reservada', 'activa'] as const)(
    'un préstamo %s: el material está pendiente de volver',
    async (status) => {
      const familia = await createUser(payload, ['familia'])
      await conAcceso(familia)
      await reserva(familia, status)
      await expect(borrar(familia.id)).rejects.toThrow(/préstamos en curso/)
      expect(await existe(familia.id)).toBe(true)
      expect(await cuantas('accounts', familia.id)).toBe(1)
    },
  )

  it('quien no es admin no borra a nadie', async () => {
    const altas = await createUser(payload, ['admin-users'])
    const familia = await createUser(payload, ['familia'])
    await expect(
      payload.delete({ collection: 'users', id: familia.id, user: altas, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
