import type { Payload, PayloadRequest } from 'payload'
import type { Noticia, Respuesta, User } from '@/payload-types'
import { ROLE_FAMILIA, isActiveUser, isStaff } from '@/core/permissions'
import { getServerSideURL } from '@/utilities/getURL'
import { COLLECTION_SLUG_NOTICIA, COLLECTION_SLUG_RESPUESTA } from '@/core/collections-slugs'
import { avisarA, idDe } from '@/modules/avisos'
import { SALTAR_AVISO } from '../collections/Noticia/hooks/avisarAlPublicar'
import { TablonRuleError } from '../domain/errors'
import { avisoDeNoticia, correoDeNoticia, destinatariosDelAviso } from '../domain/avisos'
import {
  type AreaDelTablon,
  areasVisiblesPara,
  destinatarioDelArea,
  nombreDelArea,
  puedeVerArea,
} from '../domain/areas'
import { cuerpoRichText, estaPublicada, ordenarNoticias } from '../domain/noticias'

export type Actor = Pick<User, 'id' | 'email'> & { role?: unknown; groups?: unknown }

/** Nombres de los grupos a los que pertenece, vengan poblados o como id */
const gruposDe = async (payload: Payload, user: Actor, req?: PayloadRequest): Promise<string[]> => {
  const grupos = (user.groups ?? []) as (number | { name?: string })[]
  if (!Array.isArray(grupos) || grupos.length === 0) return []

  const nombres = grupos
    .filter((g): g is { name?: string } => typeof g === 'object' && g !== null)
    .map((g) => g.name)
    .filter((n): n is string => typeof n === 'string')
  if (nombres.length === grupos.length) return nombres

  const ids = grupos.map((g) => idDe(g as number | { id: number }))
  const result = await payload.find({
    collection: 'groups',
    where: { id: { in: ids } },
    depth: 0,
    limit: 0,
    overrideAccess: true,
    req,
  })
  return result.docs.map((g) => g.name)
}

const yaAvisadosDe = async (
  payload: Payload,
  noticiaId: number | string,
  req?: PayloadRequest,
): Promise<number[]> => {
  const result = await payload.find({
    collection: 'notification',
    where: { noticia: { equals: noticiaId } },
    depth: 0,
    limit: 0,
    overrideAccess: true,
    req,
  })
  return result.docs.map((aviso) => idDe(aviso.user as number | { id: number }))
}

/**
 * A quién le llega lo que se publica en un área. Lo decide el área, no cada
 * persona: en el foro solo Berriak PAFE avisaba, y avisaba a las familias.
 */
const destinatariosDelArea = async (
  payload: Payload,
  area: string,
  req?: PayloadRequest,
): Promise<User[]> => {
  if (destinatarioDelArea(area) !== 'familias') return []

  const result = await payload.find({
    collection: 'users',
    where: { role: { contains: ROLE_FAMILIA } },
    depth: 0,
    limit: 0,
    overrideAccess: true,
    req,
  })
  return result.docs
}

/** Avisa una sola vez por noticia: deja el aviso en la campana y manda el correo */
export const avisarDeNoticia = async ({
  payload,
  noticia,
  req,
}: {
  payload: Payload
  noticia: Noticia
  /** Dentro de un hook hay transacción abierta: sin `req` nada de esto se ve */
  req?: PayloadRequest
}): Promise<number> => {
  const [familias, yaAvisados] = await Promise.all([
    destinatariosDelArea(payload, noticia.area, req),
    yaAvisadosDe(payload, noticia.id, req),
  ])
  const destinatarios = destinatariosDelAviso({
    suscriptores: familias.map((u) => Number(u.id)),
    autorId: noticia.author ? idDe(noticia.author) : null,
    yaAvisados,
  })

  const area = nombreDelArea(noticia.area)
  const { type, message } = avisoDeNoticia({ title: noticia.title, area })
  const correo = correoDeNoticia({
    title: noticia.title,
    area,
    url: `${getServerSideURL()}/noticias/${noticia.id}`,
  })

  await avisarA({
    payload,
    destinatarios: destinatarios.map((userId) => ({
      id: userId,
      email: familias.find((u) => Number(u.id) === userId)?.email,
    })),
    aviso: (userId) => ({ user: userId, type, message, noticia: Number(noticia.id) }),
    correo,
    req,
  })

  await payload.update({
    collection: COLLECTION_SLUG_NOTICIA,
    id: noticia.id,
    data: { notifiedAt: new Date().toISOString() },
    overrideAccess: true,
    context: { [SALTAR_AVISO]: true },
    req,
  })

  return destinatarios.length
}

export const publicarNoticia = async ({
  payload,
  user,
  title,
  body,
  area,
  pinned = false,
  publishedAt,
  now,
}: {
  payload: Payload
  user: Actor
  title: string
  body: string
  area: AreaDelTablon
  pinned?: boolean
  publishedAt?: string
  now: Date
}): Promise<Noticia> => {
  if (!isStaff(user as User)) throw new TablonRuleError('sin-permiso')
  if (!area) throw new TablonRuleError('area-requerida')

  const fecha = publishedAt ?? now.toISOString()
  const noticia = (await payload.create({
    collection: COLLECTION_SLUG_NOTICIA,
    data: {
      title,
      area,
      body: cuerpoRichText(body) as Noticia['body'],
      publishedAt: fecha,
      pinned,
      author: Number(user.id),
    },
    overrideAccess: true,
  })) as Noticia

  return noticia
}

export const editarNoticia = async ({
  payload,
  user,
  noticiaId,
  title,
  body,
  pinned,
}: {
  payload: Payload
  user: Actor
  noticiaId: number
  title?: string
  body?: string
  pinned?: boolean
}): Promise<Noticia> => {
  if (!isStaff(user as User)) throw new TablonRuleError('sin-permiso')

  return (await payload.update({
    collection: COLLECTION_SLUG_NOTICIA,
    id: noticiaId,
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body !== undefined ? { body: cuerpoRichText(body) as Noticia['body'] } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
    },
    overrideAccess: true,
  })) as Noticia
}

/**
 * El autor solo se guarda para no avisarle de lo suyo: poblarlo entero mandaría
 * su correo y su rol al navegador de cualquiera que mire el tablón.
 */
const SIN_DATOS_DEL_AUTOR = { users: {} }

/** Una noticia concreta, o null si quien mira no debería llegar a ella todavía */
export const noticiaDelTablon = async ({
  payload,
  user,
  id,
  now,
}: {
  payload: Payload
  user: Actor
  id: number | string
  now: Date
}): Promise<Noticia | null> => {
  if (!isActiveUser(user as User)) throw new TablonRuleError('sin-permiso')

  const grupos = await gruposDe(payload, user)

  const noticia = await payload
    .findByID({
      collection: COLLECTION_SLUG_NOTICIA,
      id,
      depth: 1,
      populate: SIN_DATOS_DEL_AUTOR,
      overrideAccess: true,
    })
    .catch((error) => {
      payload.logger.error(`[tablon] no se pudo leer la noticia ${id}: ${error}`)
      return null
    })

  if (!noticia) return null
  if (!puedeVerArea({ area: noticia.area, grupos, esStaff: isStaff(user as User) })) return null
  if (estaPublicada({ publishedAt: noticia.publishedAt, now })) return noticia as Noticia

  return isStaff(user as User) ? (noticia as Noticia) : null
}

export const noticiasDelTablon = async ({
  payload,
  user,
  area,
  now,
  archivadas = false,
  limit = 50,
}: {
  payload: Payload
  user: Actor
  area?: string
  now: Date
  /** Lo archivado no sale salvo que se pida: es lo viejo que ya no toca mirar */
  archivadas?: boolean
  limit?: number
}): Promise<Noticia[]> => {
  if (!isActiveUser(user as User)) throw new TablonRuleError('sin-permiso')

  const visibles = areasVisiblesPara({
    grupos: await gruposDe(payload, user),
    esStaff: isStaff(user as User),
  })
  if (area && !visibles.includes(area as AreaDelTablon)) return []

  const result = await payload.find({
    collection: COLLECTION_SLUG_NOTICIA,
    where: {
      and: [
        { publishedAt: { less_than_equal: now.toISOString() } },
        { area: { in: area ? [area] : visibles } },
        { archivada: { equals: archivadas } },
      ],
    },
    depth: 1,
    populate: SIN_DATOS_DEL_AUTOR,
    limit,
    overrideAccess: true,
  })

  return ordenarNoticias(result.docs as Noticia[])
}

/** Noticias programadas cuya fecha ya llegó y que todavía no han avisado */
export const avisarDeNoticiasPendientes = async ({
  payload,
  now,
}: {
  payload: Payload
  now: Date
}): Promise<{ avisadas: number }> => {
  const pendientes = await payload.find({
    collection: COLLECTION_SLUG_NOTICIA,
    where: {
      and: [
        { publishedAt: { less_than_equal: now.toISOString() } },
        { notifiedAt: { exists: false } },
      ],
    },
    depth: 0,
    limit: 0,
    overrideAccess: true,
  })

  let avisadas = 0
  for (const noticia of pendientes.docs as Noticia[]) {
    try {
      await avisarDeNoticia({ payload, noticia })
      avisadas += 1
    } catch (error) {
      payload.logger.error(
        `[tablon] no se pudo avisar de la noticia ${noticia.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  return { avisadas }
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/** Responder exige poder ver la noticia: un área restringida tampoco se contesta */
export const responder = async ({
  payload,
  user,
  noticiaId,
  mensaje,
}: {
  payload: Payload
  user: Actor
  noticiaId: number
  mensaje: string
}): Promise<Respuesta> => {
  if (!isActiveUser(user as User)) throw new TablonRuleError('sin-permiso')
  if (!mensaje.trim()) throw new TablonRuleError('mensaje-vacio')

  const noticia = await noticiaDelTablon({ payload, user, id: noticiaId, now: new Date() })
  if (!noticia) throw new TablonRuleError('noticia-no-encontrada')

  return (await payload.create({
    collection: COLLECTION_SLUG_RESPUESTA,
    data: { mensaje: mensaje.trim(), noticia: noticiaId, author: Number(user.id) },
    overrideAccess: true,
  })) as Respuesta
}

export const respuestasDe = async ({
  payload,
  user,
  noticiaId,
}: {
  payload: Payload
  user: Actor
  noticiaId: number
}): Promise<Respuesta[]> => {
  if (!isActiveUser(user as User)) throw new TablonRuleError('sin-permiso')

  const noticia = await noticiaDelTablon({ payload, user, id: noticiaId, now: new Date() })
  if (!noticia) return []

  const result = await payload.find({
    collection: COLLECTION_SLUG_RESPUESTA,
    where: { noticia: { equals: noticiaId } },
    sort: 'createdAt',
    depth: 1,
    limit: 0,
    overrideAccess: true,
    populate: { users: { name: true } },
  })
  return result.docs as Respuesta[]
}

const respuestaPropia = async (
  payload: Payload,
  user: Actor,
  respuestaId: number,
): Promise<Respuesta> => {
  const respuesta = (await payload.findByID({
    collection: COLLECTION_SLUG_RESPUESTA,
    id: respuestaId,
    depth: 0,
    overrideAccess: true,
  })) as Respuesta

  const suya = idDe(respuesta.author as number | { id: number }) === Number(user.id)
  if (!suya && !isStaff(user as User)) throw new TablonRuleError('sin-permiso')
  return respuesta
}

export const editarRespuesta = async ({
  payload,
  user,
  respuestaId,
  mensaje,
}: {
  payload: Payload
  user: Actor
  respuestaId: number
  mensaje: string
}): Promise<Respuesta> => {
  await respuestaPropia(payload, user, respuestaId)
  if (!mensaje.trim()) throw new TablonRuleError('mensaje-vacio')

  return (await payload.update({
    collection: COLLECTION_SLUG_RESPUESTA,
    id: respuestaId,
    data: { mensaje: mensaje.trim() },
    overrideAccess: true,
  })) as Respuesta
}

export const borrarRespuesta = async ({
  payload,
  user,
  respuestaId,
}: {
  payload: Payload
  user: Actor
  respuestaId: number
}): Promise<void> => {
  await respuestaPropia(payload, user, respuestaId)

  await payload.delete({
    collection: COLLECTION_SLUG_RESPUESTA,
    id: respuestaId,
    overrideAccess: true,
  })
}

const cambiarArchivado = async ({
  payload,
  user,
  noticiaId,
  archivada,
}: {
  payload: Payload
  user: Actor
  noticiaId: number
  archivada: boolean
}): Promise<Noticia> => {
  if (!isStaff(user as User)) throw new TablonRuleError('sin-permiso')

  return (await payload.update({
    collection: COLLECTION_SLUG_NOTICIA,
    id: noticiaId,
    data: { archivada },
    overrideAccess: true,
    // Archivar no es publicar: nadie tiene que enterarse otra vez
    context: { [SALTAR_AVISO]: true },
  })) as Noticia
}

/** Saca la noticia del tablón sin borrarla, como las «Archivadas» del foro */
export const archivarNoticia = (args: { payload: Payload; user: Actor; noticiaId: number }) =>
  cambiarArchivado({ ...args, archivada: true })

export const desarchivarNoticia = (args: { payload: Payload; user: Actor; noticiaId: number }) =>
  cambiarArchivado({ ...args, archivada: false })
