import {
  COLLECTION_SLUG_GUIDED_QUESTIONNAIRES,
  COLLECTION_SLUG_QUESTIONNAIRE_EXECUTIONS,
  COLLECTION_SLUG_TASKS,
  COLLECTION_SLUG_USER,
} from '@/core/collections-slugs'
import { hiddenUnlessStaff, isAdminAccess, staffOrOwnerAccess } from '@/core/permissions'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { parseEvents } from 'flowgraph-core'
import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

/**
 * Valida el event log contra el cuestionario referenciado re-derivando cada
 * evento con el runtime (replay). Un log que no se pueda re-derivar —incluido
 * uno grabado contra otra versión del esquema— se rechaza. Los campos
 * derivados (outcome, hash, fechas) se calculan siempre aquí a partir del log,
 * nunca se aceptan del cliente.
 */
const validateExecution: CollectionBeforeChangeHook = async ({ data, req }) => {
  const questionnaireID =
    typeof data.questionnaire === 'object' && data.questionnaire !== null
      ? data.questionnaire.id
      : data.questionnaire
  if (questionnaireID === undefined || questionnaireID === null) {
    throw new APIError('La ejecución debe referenciar un cuestionario.', 400)
  }

  const questionnaire = await req.payload
    .findByID({
      collection: COLLECTION_SLUG_GUIDED_QUESTIONNAIRES,
      id: questionnaireID,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!questionnaire) {
    throw new APIError('El cuestionario referenciado no existe.', 400)
  }

  const schema = flowGraphRuntime.parseSchema(questionnaire.schema)
  if (!schema.ok) {
    throw new APIError('La definición FlowGraph del cuestionario no es válida.', 400)
  }

  const events = parseEvents(data.events)
  if (!events.ok) {
    throw new APIError('El registro de eventos no es válido.', 400)
  }

  const replayed = flowGraphRuntime.replay(schema.value, events.value)
  if (!replayed.ok) {
    throw new APIError(
      `El registro de eventos no se corresponde con el cuestionario (${replayed.error.code}).`,
      400,
    )
  }
  if (replayed.value.status !== 'finished' || replayed.value.outcome === undefined) {
    throw new APIError('La ejecución no ha llegado a un resultado terminal.', 400)
  }

  const first = events.value[0]
  const last = events.value[events.value.length - 1]
  return {
    ...data,
    events: events.value,
    outcome: replayed.value.outcome,
    schemaID: schema.value.id,
    schemaVersion: schema.value.version,
    schemaHash: replayed.value.schemaHash,
    startedAt: first ? new Date(first.at).toISOString() : undefined,
    finishedAt: last ? new Date(last.at).toISOString() : undefined,
  }
}

export const QuestionnaireExecutions: CollectionConfig = {
  slug: COLLECTION_SLUG_QUESTIONNAIRE_EXECUTIONS,
  labels: {
    singular: 'Ejecución de cuestionario',
    plural: 'Ejecuciones de cuestionarios',
  },
  access: {
    // Las crea la server action de envío (Local API); vía REST solo un admin,
    // y siempre pasando por la validación de replay del hook.
    create: isAdminAccess,
    // El histórico es inmutable; solo un admin corrige errores
    delete: isAdminAccess,
    read: staffOrOwnerAccess('user'),
    update: isAdminAccess,
  },
  admin: {
    hidden: hiddenUnlessStaff,
    defaultColumns: ['questionnaire', 'user', 'outcome', 'finishedAt'],
    useAsTitle: 'id',
  },
  fields: [
    {
      label: 'Cuestionario',
      name: 'questionnaire',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_GUIDED_QUESTIONNAIRES,
      required: true,
      index: true,
    },
    {
      label: 'Usuario',
      name: 'user',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_USER,
      required: true,
      index: true,
    },
    {
      label: 'Tarea',
      name: 'task',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_TASKS,
      admin: {
        description: 'Tarea desde la que se lanzó el cuestionario, si procede',
        position: 'sidebar',
      },
    },
    {
      label: 'Registro de eventos',
      name: 'events',
      type: 'json',
      required: true,
      admin: { readOnly: true },
    },
    {
      label: 'Resultado',
      name: 'outcome',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      label: 'ID del esquema',
      name: 'schemaID',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      label: 'Versión del esquema',
      name: 'schemaVersion',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      label: 'Hash del esquema',
      name: 'schemaHash',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      label: 'Iniciada en',
      name: 'startedAt',
      type: 'date',
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      label: 'Terminada en',
      name: 'finishedAt',
      type: 'date',
      index: true,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  hooks: {
    beforeChange: [validateExecution],
  },
  timestamps: true,
}
