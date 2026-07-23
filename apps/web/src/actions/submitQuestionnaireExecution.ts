'use server'

import { getUserCaseIDs, isActiveUser, isStaff } from '@/core/permissions'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { getSessionUser } from '@/utilities/getSessionUser'
import { parseEvents } from 'flowgraph-core'

export type SubmitExecutionResult =
  | { ok: true; executionId: number | string; outcome: string; taskCompleted: boolean }
  | { ok: false; error: string }

type SubmitExecutionInput = {
  questionnaireId: number | string
  events: unknown
  taskId?: number
}

const relationID = (value: unknown): number | string | undefined =>
  typeof value === 'object' && value !== null
    ? (value as { id?: number | string }).id
    : typeof value === 'number' || typeof value === 'string'
      ? value
      : undefined

/**
 * Recibe el event log de una ejecución terminada, lo revalida en servidor
 * (replay determinista contra el esquema vigente) y lo persiste como
 * evidencia. Si la ejecución llegó desde una tarea del usuario, registra
 * además la completación de esa tarea enlazada a la ejecución.
 */
export async function submitQuestionnaireExecution(
  input: SubmitExecutionInput,
): Promise<SubmitExecutionResult> {
  try {
    const { payload, user } = await getSessionUser()
    if (!user || !isActiveUser(user)) {
      return { ok: false, error: 'No tienes permiso para enviar cuestionarios' }
    }

    const questionnaire = await payload
      .findByID({
        collection: 'guided-questionnaires',
        id: input.questionnaireId,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)
    if (!questionnaire) return { ok: false, error: 'El cuestionario no existe' }

    // Validación previa a la escritura para devolver errores legibles; el
    // hook beforeChange de la colección la repite como última barrera.
    const events = parseEvents(input.events)
    if (!events.ok) return { ok: false, error: 'El registro de respuestas no es válido' }

    const schema = flowGraphRuntime.parseSchema(questionnaire.schema)
    if (!schema.ok) {
      return { ok: false, error: 'El cuestionario no está disponible en este momento' }
    }

    const replayed = flowGraphRuntime.replay(schema.value, events.value)
    if (!replayed.ok) {
      return {
        ok: false,
        error:
          'Tus respuestas no se corresponden con la versión actual del cuestionario. Vuelve a empezar para responder a la versión vigente.',
      }
    }
    if (replayed.value.status !== 'finished' || replayed.value.outcome === undefined) {
      return { ok: false, error: 'El cuestionario no está terminado' }
    }

    const last = events.value[events.value.length - 1]
    const finishedAt = last ? new Date(last.at).toISOString() : undefined

    // Reenvío del mismo log (p.ej. sesión restaurada tras enviar): reutilizar
    const existing = finishedAt
      ? await payload.find({
          collection: 'questionnaire-executions',
          where: {
            and: [
              { user: { equals: user.id } },
              { questionnaire: { equals: questionnaire.id } },
              { finishedAt: { equals: finishedAt } },
            ],
          },
          depth: 0,
          limit: 1,
          overrideAccess: true,
        })
      : { docs: [] }

    const execution =
      existing.docs[0] ??
      (await payload.create({
        collection: 'questionnaire-executions',
        data: {
          questionnaire: questionnaire.id,
          user: user.id,
          task: input.taskId,
          events: events.value as unknown as Record<string, unknown>[],
        },
        overrideAccess: true,
      }))

    let taskCompleted = false
    if (input.taskId !== undefined) {
      taskCompleted = await completeLinkedTask(payload, user, input.taskId, questionnaire.id, execution.id)
    }

    return { ok: true, executionId: execution.id, outcome: replayed.value.outcome, taskCompleted }
  } catch (error) {
    console.error('Error submitting questionnaire execution:', error)
    return { ok: false, error: 'No se ha podido guardar tu respuesta. Inténtalo de nuevo.' }
  }
}

const completeLinkedTask = async (
  payload: Awaited<ReturnType<typeof getSessionUser>>['payload'],
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>['user']>,
  taskId: number,
  questionnaireId: number | string,
  executionId: number | string,
): Promise<boolean> => {
  const task = await payload
    .findByID({ collection: 'tasks', id: taskId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!task) return false

  const referencesQuestionnaire = (task.resources ?? []).some(
    (resource) =>
      resource.relationTo === 'guided-questionnaires' &&
      String(relationID(resource.value)) === String(questionnaireId),
  )
  if (!referencesQuestionnaire) return false

  if (!isStaff(user)) {
    const caseIDs = getUserCaseIDs(user).map(String)
    const taskCases = (Array.isArray(task.case) ? task.case : [])
      .map(relationID)
      .filter((id): id is number | string => id !== undefined)
    if (!taskCases.some((id) => caseIDs.includes(String(id)))) return false
  }

  // Paridad con completeTask: una completación por día; si ya existe, no duplicar
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const already = await payload.find({
    collection: 'tasks-completed',
    where: {
      and: [
        { task: { equals: taskId } },
        { user: { equals: user.id } },
        { completedOn: { greater_than_equal: dayStart.toISOString() } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  if (already.docs.length > 0) return true

  await payload.create({
    collection: 'tasks-completed',
    data: {
      task: taskId,
      user: Number(user.id),
      completedOn: dayStart.toISOString(),
      execution: Number(executionId),
    },
    overrideAccess: true,
  })
  return true
}
