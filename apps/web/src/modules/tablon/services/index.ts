import type { Payload, PayloadRequest } from 'payload'
import type { Noticia, Taxonomy, User } from '@/payload-types'
import { isActiveUser, isStaff } from '@/core/permissions'
import { getServerSideURL } from '@/utilities/getURL'
import { COLLECTION_SLUG_NOTICIA } from '@/core/collections-slugs'
import { SALTAR_AVISO } from '../collections/Noticia/hooks/avisarAlPublicar'
import { TablonRuleError } from '../domain/errors'
import { avisoDeNoticia, correoDeNoticia, destinatariosDelAviso, soloAreas } from '../domain/avisos'
import { cuerpoRichText, ordenarNoticias } from '../domain/noticias'

export type Actor = Pick<User, 'id' | 'email'> & { role?: unknown }

const idDe = (valor: number | { id: number } | null | undefined): number =>
  typeof valor === 'object' && valor !== null ? valor.id : (valor as number)

const nombreDelArea = (area: Noticia['area']): string =>
  typeof area === 'object' && area !== null ? ((area as Taxonomy).name ?? 'el tablón') : 'el tablón'

/**
 * El aviso ya está guardado cuando se manda el correo: que falle el envío no
 * puede tumbar la publicación ni borrar lo que la persona ve en la campana.
 */
const enviarCorreoSinRomper = async (
  payload: Payload,
  message: { to: string; subject: string; text: string; html: string },
): Promise<void> => {
  try {
    await payload.sendEmail(message)
  } catch (error) {
    payload.logger.error(
      `[tablon] fallo enviando "${message.subject}" a ${message.to}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
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

const suscriptoresDelArea = async (
  payload: Payload,
  areaId: number,
  req?: PayloadRequest,
): Promise<User[]> => {
  const result = await payload.find({
    collection: 'users',
    where: { areasSuscritas: { contains: areaId } },
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
  const areaId = idDe(noticia.area)
  const [suscriptores, yaAvisados] = await Promise.all([
    suscriptoresDelArea(payload, areaId, req),
    yaAvisadosDe(payload, noticia.id, req),
  ])
  const destinatarios = destinatariosDelAviso({
    suscriptores: suscriptores.map((u) => Number(u.id)),
    autorId: noticia.author ? idDe(noticia.author) : null,
    yaAvisados,
  })

  const area = await payload.findByID({
    collection: 'taxonomy',
    id: areaId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const { type, message } = avisoDeNoticia({ title: noticia.title, area: area.name })
  const correo = correoDeNoticia({
    title: noticia.title,
    area: area.name,
    url: `${getServerSideURL()}/noticias/${noticia.id}`,
  })

  for (const userId of destinatarios) {
    await payload.create({
      collection: 'notification',
      data: { user: userId, type, message, noticia: Number(noticia.id) },
      overrideAccess: true,
      req,
    })
  }

  for (const userId of destinatarios) {
    const destinatario = suscriptores.find((u) => Number(u.id) === userId)
    if (destinatario?.email) {
      await enviarCorreoSinRomper(payload, { to: destinatario.email, ...correo })
    }
  }

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
  areaId,
  pinned = false,
  publishedAt,
  now,
}: {
  payload: Payload
  user: Actor
  title: string
  body: string
  areaId: number
  pinned?: boolean
  publishedAt?: string
  now: Date
}): Promise<Noticia> => {
  if (!isStaff(user as User)) throw new TablonRuleError('sin-permiso')
  if (!areaId) throw new TablonRuleError('area-requerida')

  const fecha = publishedAt ?? now.toISOString()
  const noticia = (await payload.create({
    collection: COLLECTION_SLUG_NOTICIA,
    data: {
      title,
      area: areaId,
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

export const noticiasDelTablon = async ({
  payload,
  user,
  areaId,
  now,
  limit = 50,
}: {
  payload: Payload
  user: Actor
  areaId?: number
  now: Date
  limit?: number
}): Promise<Noticia[]> => {
  if (!isActiveUser(user as User)) throw new TablonRuleError('sin-permiso')

  const result = await payload.find({
    collection: COLLECTION_SLUG_NOTICIA,
    where: {
      and: [
        { publishedAt: { less_than_equal: now.toISOString() } },
        ...(areaId ? [{ area: { equals: areaId } }] : []),
      ],
    },
    depth: 1,
    limit,
    overrideAccess: true,
  })

  return ordenarNoticias(result.docs as Noticia[])
}

const esArea = (termino: Taxonomy): boolean =>
  Array.isArray(termino.payload?.types) && termino.payload.types.includes('area')

/** Las áreas del tablón, que son los términos de taxonomía marcados como tales */
export const areasDelTablon = async (payload: Payload): Promise<Taxonomy[]> => {
  const taxonomia = await payload.find({
    collection: 'taxonomy',
    pagination: false,
    sort: 'name',
    overrideAccess: true,
  })
  return taxonomia.docs.filter(esArea)
}

/** Las áreas de las que esta persona quiere recibir aviso */
export const elegirAreas = async ({
  payload,
  user,
  areaIds,
}: {
  payload: Payload
  user: Actor
  areaIds: number[]
}): Promise<void> => {
  const areas = await areasDelTablon(payload)

  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      areasSuscritas: soloAreas({
        pedidas: areaIds,
        areasReales: areas.map((area) => Number(area.id)),
      }),
    },
    overrideAccess: true,
  })
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

export { nombreDelArea }
