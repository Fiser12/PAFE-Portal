import type { Payload, PayloadRequest } from 'payload'
import type { Task, User } from '@/payload-types'
import type { RRuleValue } from '@/types/rrule'
import { getServerSideURL } from '@/utilities/getURL'

/** Las familias ven sus tareas dentro de su caso; no hay página por tarea */
const URL_DE_LAS_TAREAS = `${getServerSideURL()}/cases`
import { COLLECTION_SLUG_TASKS, COLLECTION_SLUG_TASKS_COMPLETED } from '@/core/collections-slugs'
import { avisarA, idDe } from '@/modules/avisos'
import {
  avisoDeTareaAsignada,
  avisoDeTareaQueToca,
  correoDeTareaAsignada,
  correoDeTareaQueToca,
} from '../domain/avisos'
import { tocaOtraVez } from '../domain/ocurrencias'

/**
 * Cuándo vuelve a tocar, contando desde la última vez que se hizo. La regla se
 * ancla ahí a propósito: sin DTSTART, rrule arranca la serie en el instante en
 * que se construye y toda tarea recurrente sale vencida nada más completarla.
 */
const proximaVuelta = async (regla: string, desde: Date): Promise<Date | null> => {
  const { default: rrule } = await import('rrule')
  try {
    const opciones = rrule.RRule.parseString(regla)
    return new rrule.RRule({ ...opciones, dtstart: desde }).after(desde, false)
  } catch {
    return null
  }
}

const cadenciaLegible = async (valor: RRuleValue): Promise<string> => {
  const { rruleToText } = await import('@/utils/rrule-helpers')
  return rruleToText(valor)
}

const casosDe = (tarea: Task): number[] => (tarea.case ?? []).map(idDe)

/** Las familias a las que se les asignó alguno de los casos de la tarea */
const destinatariosDeLaTarea = async (
  payload: Payload,
  tarea: Task,
  req?: PayloadRequest,
): Promise<User[]> => {
  const casos = casosDe(tarea)
  if (casos.length === 0) return []

  const result = await payload.find({
    collection: 'users',
    where: { assignedCases: { in: casos } },
    depth: 0,
    limit: 0,
    overrideAccess: true,
    req,
  })
  return result.docs
}

const avisosDeLaTarea = async (
  payload: Payload,
  tareaId: number | string,
  type: string,
  req?: PayloadRequest,
) => {
  const result = await payload.find({
    collection: 'notification',
    where: { and: [{ tarea: { equals: tareaId } }, { type: { equals: type } }] },
    depth: 0,
    limit: 0,
    overrideAccess: true,
    req,
  })
  return result.docs
}

/** Avisa a quien acaba de recibir la tarea, una sola vez */
export const avisarDeTareaAsignada = async ({
  payload,
  tarea,
  req,
}: {
  payload: Payload
  tarea: Task
  req?: PayloadRequest
}): Promise<number> => {
  const [familias, yaAvisados] = await Promise.all([
    destinatariosDeLaTarea(payload, tarea, req),
    avisosDeLaTarea(payload, tarea.id, 'tarea-asignada', req),
  ])
  const avisadas = new Set(yaAvisados.map((aviso) => idDe(aviso.user as number | { id: number })))
  const destinatarios = familias
    .filter((familia) => !avisadas.has(Number(familia.id)))
    .map((familia) => ({ id: Number(familia.id), email: familia.email }))

  const { type, message } = avisoDeTareaAsignada(tarea.title)

  return avisarA({
    payload,
    destinatarios,
    aviso: (userId) => ({ user: userId, type, message, tarea: Number(tarea.id) }),
    correo: correoDeTareaAsignada({ title: tarea.title, url: URL_DE_LAS_TAREAS }),
    req,
  })
}

const ultimaCompletacion = async (
  payload: Payload,
  tareaId: number,
  userId: number,
): Promise<Date | null> => {
  const result = await payload.find({
    collection: COLLECTION_SLUG_TASKS_COMPLETED,
    where: { and: [{ task: { equals: tareaId } }, { user: { equals: userId } }] },
    sort: '-completedOn',
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const completada = result.docs[0]?.completedOn
  return completada ? new Date(completada) : null
}

/**
 * Las tareas recurrentes que vuelven a tocar. El estado es por persona, así que
 * se mira caso por caso: una familia puede ir al día y otra no.
 */
export const avisarDeTareasQueTocan = async ({
  payload,
  now,
}: {
  payload: Payload
  now: Date
}): Promise<{ avisadas: number }> => {
  const recurrentes = await payload.find({
    collection: COLLECTION_SLUG_TASKS,
    where: { rrule: { exists: true } },
    depth: 0,
    limit: 0,
    overrideAccess: true,
  })

  let avisadas = 0
  for (const tarea of recurrentes.docs as Task[]) {
    try {
      avisadas += await avisarDeLaVuelta({ payload, tarea, now })
    } catch (error) {
      payload.logger.error(
        `[tareas] no se pudo avisar de la tarea ${tarea.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  return { avisadas }
}

const avisarDeLaVuelta = async ({
  payload,
  tarea,
  now,
}: {
  payload: Payload
  tarea: Task
  now: Date
}): Promise<number> => {
  const rrule = tarea.rrule as RRuleValue | null | undefined
  if (!rrule?.rrule) return 0

  const [familias, avisosPrevios] = await Promise.all([
    destinatariosDeLaTarea(payload, tarea),
    avisosDeLaTarea(payload, tarea.id, 'tarea-toca'),
  ])

  const ultimoAvisoPor = new Map<number, Date>()
  for (const aviso of avisosPrevios) {
    const userId = idDe(aviso.user as number | { id: number })
    const cuando = new Date(aviso.createdAt)
    const previo = ultimoAvisoPor.get(userId)
    if (!previo || previo < cuando) ultimoAvisoPor.set(userId, cuando)
  }

  const destinatarios: { id: number; email?: string | null }[] = []
  for (const familia of familias) {
    const userId = Number(familia.id)
    const completada = await ultimaCompletacion(payload, Number(tarea.id), userId)
    if (!completada) continue

    const vencimiento = await proximaVuelta(rrule.rrule, completada)
    if (tocaOtraVez({ vencimiento, ultimoAviso: ultimoAvisoPor.get(userId) ?? null, now })) {
      destinatarios.push({ id: userId, email: familia.email })
    }
  }

  if (destinatarios.length === 0) return 0

  const { type, message } = avisoDeTareaQueToca(tarea.title)

  return avisarA({
    payload,
    destinatarios,
    aviso: (userId) => ({ user: userId, type, message, tarea: Number(tarea.id) }),
    correo: correoDeTareaQueToca({
      title: tarea.title,
      cadencia: await cadenciaLegible(rrule),
      url: URL_DE_LAS_TAREAS,
    }),
  })
}
