import type { Payload } from 'payload'
import type { User } from '@/payload-types'

let seq = 0
const uniq = () => `${Date.now().toString(36)}-${++seq}`

type Role = NonNullable<User['role']>

export const createUser = (payload: Payload, role: Role, name = 'Usuario Test') =>
  payload.create({
    collection: 'users',
    data: { email: `u-${uniq()}@pafe.test`, name, role, emailVerified: true },
    overrideAccess: true,
  })

export const createFamilia = (payload: Payload) => createUser(payload, ['familia'], 'Familia Test')
export const createStaff = (payload: Payload) =>
  createUser(payload, ['profesional'], 'Profesional Test')
export const createPendiente = (payload: Payload) => createUser(payload, [], 'Pendiente Test')

let taxonomyId: Promise<number | string> | undefined

/** Una taxonomía compartida: `categories` es obligatorio en catalog-item */
const getTaxonomy = (payload: Payload) =>
  (taxonomyId ??= payload
    .create({
      collection: 'taxonomy',
      data: { name: `Tests ${uniq()}`, slug: `tests-${uniq()}` },
      overrideAccess: true,
    })
    .then((doc) => doc.id))

export const createItem = async (
  payload: Payload,
  opts: { quantity?: number; title?: string } = {},
) =>
  payload.create({
    collection: 'catalog-item',
    data: {
      title: opts.title ?? `Material ${uniq()}`,
      type: 'libro',
      quantity: opts.quantity ?? 1,
      categories: [Number(await getTaxonomy(payload))],
    },
    overrideAccess: true,
  })

export const createCase = (payload: Payload, title = 'Caso Test') =>
  payload.create({
    collection: 'cases',
    data: { title: `${title} ${uniq()}` },
    overrideAccess: true,
  })

/** El vínculo vive en el usuario: `cases.assignedUser` es un join sobre esto */
export const asignarCaso = (payload: Payload, userId: number | string, caseId: number | string) =>
  payload.update({
    collection: 'users',
    id: userId,
    data: { assignedCases: [Number(caseId)] },
    overrideAccess: true,
  })

export const createTask = (
  payload: Payload,
  caseIds: (number | string)[],
  opts: { title?: string; rrule?: string } = {},
) =>
  payload.create({
    collection: 'tasks',
    data: {
      title: opts.title ?? `Tarea ${uniq()}`,
      case: caseIds.map(Number),
      ...(opts.rrule ? { rrule: { rrule: opts.rrule } } : {}),
    },
    overrideAccess: true,
  })

export const completarTarea = (
  payload: Payload,
  taskId: number | string,
  userId: number | string,
  completedOn: string,
) =>
  payload.create({
    collection: 'tasks-completed',
    data: { task: Number(taskId), user: Number(userId), completedOn },
    overrideAccess: true,
  })
