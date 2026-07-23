/**
 * Verifica de extremo a extremo la persistencia de ejecuciones de
 * cuestionarios: simula una sesión FlowGraph completa, la guarda vía Local API
 * (pasando por el hook de validación por replay) y comprueba que los logs
 * manipulados se rechazan.
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm payload run scripts/verify-questionnaire-executions.ts
 */
import { getPayload } from 'payload'
import { hashSchema, toOptionId, toSafeInt, type CommandMeta, type Event } from 'flowgraph-core'
import { createSession } from 'flowgraph-session'
import config from '../src/payload.config'
import { createDefaultFlowSchema } from '../src/lib/flowgraph/defaultSchema'
import { flowGraphRuntime } from '../src/lib/flowgraph/runtime'

const meta = (): CommandMeta => ({ at: toSafeInt(Date.now()), source: 'human', path: [] })

const fail = (message: string): never => {
  console.error(`✗ ${message}`)
  process.exit(1)
}

const payload = await getPayload({ config })

// 1. Cuestionario de trabajo (reutiliza el primero o crea uno de prueba)
const existing = await payload.find({
  collection: 'guided-questionnaires',
  limit: 1,
  overrideAccess: true,
})
let questionnaire = existing.docs[0]
let createdQuestionnaire = false
if (!questionnaire) {
  questionnaire = await payload.create({
    collection: 'guided-questionnaires',
    data: { title: 'Cuestionario de prueba (script)', schema: createDefaultFlowSchema() },
    overrideAccess: true,
  })
  createdQuestionnaire = true
}
console.log(`· Cuestionario: ${questionnaire.title} (id ${questionnaire.id})`)

const parsed = flowGraphRuntime.parseSchema(questionnaire.schema)
if (!parsed.ok) fail(`El esquema almacenado no parsea: ${JSON.stringify(parsed.error[0])}`)
const schema = parsed.ok ? parsed.value : (undefined as never)

// 2. Simular una sesión completa con el runtime real
const created = createSession(flowGraphRuntime, schema)
if (!created.ok) fail(`No se pudo crear la sesión: ${created.error.code}`)
const session = created.ok ? created.value : (undefined as never)

const dispatch = (command: Parameters<typeof session.dispatch>[0], label: string) => {
  const result = session.dispatch(command)
  if (!result.ok) fail(`${label}: ${JSON.stringify(result.error)}`)
}

dispatch({ kind: 'START', schemaHash: hashSchema(schema), meta: meta() }, 'START')
// Respuestas del esquema por defecto (texto + select "no" → terminal directo)
dispatch({ kind: 'ANSWER', q: 'nombre' as never, value: 'Script de prueba', meta: meta() }, 'ANSWER nombre')
dispatch(
  { kind: 'ANSWER', q: 'necesita_apoyo' as never, value: [toOptionId('no')], meta: meta() },
  'ANSWER necesita_apoyo',
)
dispatch({ kind: 'NEXT', meta: meta() }, 'NEXT')

const snapshot = session.getSnapshot()
if (snapshot.status !== 'finished') fail(`La sesión no terminó: ${snapshot.status}`)
const events = session.getEvents()
console.log(`· Sesión simulada: ${events.length} eventos, outcome ${String(snapshot.status === 'finished' ? snapshot.outcome : '')}`)

// 3. Usuario de trabajo
const users = await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
const user = users.docs[0]
if (!user) fail('No hay usuarios en la base de datos')
const userID = user ? user.id : (undefined as never)

// 4. Crear la ejecución: debe pasar la validación por replay del hook
const execution = await payload.create({
  collection: 'questionnaire-executions',
  data: {
    questionnaire: questionnaire.id,
    user: userID,
    events: events as unknown as Record<string, unknown>[],
  },
  overrideAccess: true,
})
if (execution.outcome !== 'completado') fail(`Outcome inesperado: ${execution.outcome}`)
if (execution.schemaHash !== hashSchema(schema)) fail('El hash derivado no coincide')
if (!execution.startedAt || !execution.finishedAt) fail('Faltan las fechas derivadas')
console.log(`✓ Ejecución válida aceptada (id ${execution.id}, outcome ${execution.outcome})`)

// 5. Logs manipulados: deben rechazarse
const truncated = events.slice(0, -1)
const tampered: Event[] = events.map((event) =>
  event.kind === 'ANSWERED' && event.q === ('necesita_apoyo' as never)
    ? { ...event, value: ['si'] as never }
    : event,
)
for (const [label, log] of [
  ['log truncado (sin SESSION_FINISHED)', truncated],
  ['log con respuesta alterada', tampered],
] as const) {
  const rejected = await payload
    .create({
      collection: 'questionnaire-executions',
      data: {
        questionnaire: questionnaire.id,
        user: userID,
        events: log as unknown as Record<string, unknown>[],
      },
      overrideAccess: true,
    })
    .then(() => false)
    .catch(() => true)
  if (!rejected) fail(`Se aceptó un ${label}`)
  console.log(`✓ Rechazado: ${label}`)
}

// 6. Limpieza
await payload.delete({ collection: 'questionnaire-executions', id: execution.id, overrideAccess: true })
if (createdQuestionnaire) {
  await payload.delete({
    collection: 'guided-questionnaires',
    id: questionnaire.id,
    overrideAccess: true,
  })
}
console.log('✓ Verificación completa: persistencia y validación por replay funcionan')
process.exit(0)
