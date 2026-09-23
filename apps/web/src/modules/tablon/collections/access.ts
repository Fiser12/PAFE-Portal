import type { Access, PayloadRequest, Where } from 'payload'
import { isActiveUser, isStaff } from '@/core/permissions'
import { areasVisiblesPara } from '../domain/areas'

async function areasPermitidas(req: PayloadRequest) {
  if (!req.user || !isActiveUser(req.user)) return []
  if (isStaff(req.user)) return areasVisiblesPara({ grupos: [], esStaff: true })
  const ids = (req.user.groups ?? []).map((group) => (typeof group === 'object' ? group.id : group))
  const grupos = ids.length
    ? await req.payload.find({
        collection: 'groups',
        where: { id: { in: ids } },
        depth: 0,
        pagination: false,
        overrideAccess: true,
        req,
      })
    : { docs: [] }
  return areasVisiblesPara({ grupos: grupos.docs.map((group) => group.name), esStaff: false })
}

export const leerNoticia: Access = async ({ req }) => {
  if (!isActiveUser(req.user)) return false
  if (isStaff(req.user)) return true
  const where: Where = {
    and: [
      { area: { in: await areasPermitidas(req) } },
      { publishedAt: { less_than_equal: new Date().toISOString() } },
    ],
  }
  return where
}

export const leerRespuesta: Access = async ({ req }) => {
  if (!isActiveUser(req.user)) return false
  if (isStaff(req.user)) return true
  const where: Where = {
    and: [
      { 'noticia.area': { in: await areasPermitidas(req) } },
      { 'noticia.publishedAt': { less_than_equal: new Date().toISOString() } },
    ],
  }
  return where
}

export const crearRespuesta: Access = async ({ req, data }) => {
  if (!req.user || !isActiveUser(req.user) || !data?.noticia) return false
  if (Number(data.author) !== Number(req.user.id)) return false
  const visible = await req.payload.find({
    collection: 'noticia',
    where: { id: { equals: data.noticia } },
    depth: 0,
    limit: 1,
    user: req.user,
    overrideAccess: false,
    req,
  })
  return Boolean(visible.docs[0] && !visible.docs[0].cerrada)
}

export const leerAdjunto: Access = async ({ req }) => {
  if (!isActiveUser(req.user)) return false
  if (isStaff(req.user)) return true
  const where: Where = {
    or: [{ area: { in: await areasPermitidas(req) } }, { area: { exists: false } }],
  }
  return where
}
