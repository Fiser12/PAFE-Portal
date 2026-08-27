import type { Payload } from 'payload'

let seq = 0
const uniq = () => `${Date.now().toString(36)}-${++seq}`

export const createUser = (payload: Payload, role: string[], name = 'Usuario Test') =>
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
      data: { name: `Tests ${uniq()}` },
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
      categories: [await getTaxonomy(payload)],
    },
    overrideAccess: true,
  })
