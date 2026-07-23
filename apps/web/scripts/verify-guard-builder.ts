/**
 * Verifica que el condition builder del editor y el core hablan el mismo
 * idioma: cada guard que el builder puede construir debe ser aceptado por
 * parseSchema/check, y la elegibilidad de preguntas debe respetar la regla
 * de buena fundación del runtime.
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm payload run scripts/verify-guard-builder.ts
 */
import { flowGraphReactQuestionPlugins } from '../src/lib/flowgraph/react'
import { flowGraphRuntime } from '../src/lib/flowgraph/runtime'
import type { GuardDraft, SchemaDraft } from '../src/payload/admin_components/FlowGraph/draft-types'
import {
  availableGuardKinds,
  defaultGuardForKind,
  eligibleQuestions,
  guardLabel,
  operatorsForComparison,
} from '../src/payload/admin_components/FlowGraph/guards'

const fail = (message: string): never => {
  console.error(`✗ ${message}`)
  process.exit(1)
}

const text = (key: string, fallback: string) => ({ key, fallback })

// Grafo de prueba: inicio → segunda → final, con guards de toda la gramática
const complexGuard: GuardDraft = {
  kind: 'all',
  values: [
    { kind: 'selected', q: 'tipo', option: 'a' },
    {
      kind: 'any',
      values: [
        {
          kind: 'cmp',
          op: 'gte',
          left: { kind: 'sum', values: [{ kind: 'score', q: 'tipo' }, { kind: 'num', value: 1 }] },
          right: { kind: 'num', value: 2 },
        },
        { kind: 'not', value: { kind: 'answered', q: 'nombre' } },
      ],
    },
  ],
}

const schema: SchemaDraft = {
  id: 'verificacion-builder',
  version: '1',
  entry: 'inicio',
  nodes: {
    inicio: {
      kind: 'page',
      title: text('page.inicio.title', 'Inicio'),
      questions: [
        {
          id: 'nombre',
          kind: 'text',
          text: text('question.nombre', 'Nombre'),
          required: true,
        },
        {
          id: 'tipo',
          kind: 'select',
          text: text('question.tipo', 'Tipo'),
          visibleWhen: { kind: 'answered', q: 'nombre' },
          options: [
            { id: 'a', text: text('option.a', 'A'), weight: 2 },
            { id: 'b', text: text('option.b', 'B'), weight: 0 },
          ],
        },
      ],
      edges: [
        { to: 'segunda', when: complexGuard },
        { to: 'final', when: { kind: 'always' } },
      ],
    },
    segunda: {
      kind: 'page',
      title: text('page.segunda.title', 'Segunda'),
      questions: [
        {
          id: 'extra',
          kind: 'number',
          text: text('question.extra', 'Extra'),
          visibleWhen: { kind: 'selected', q: 'tipo', option: 'a' },
        },
      ],
      edges: [{ to: 'final', when: { kind: 'always' } }],
    },
    aislada: {
      kind: 'page',
      title: text('page.aislada.title', 'Aislada'),
      questions: [{ id: 'perdida', kind: 'text', text: text('question.perdida', 'Perdida') }],
      edges: [{ to: 'final', when: { kind: 'always' } }],
    },
    final: { kind: 'terminal', outcome: 'hecho' },
  },
}

// 1. Round-trip: el draft del builder debe parsear en el core
const withManifest = {
  ...schema,
  questionPlugins: flowGraphRuntime.questionPluginManifest,
}
const parsed = flowGraphRuntime.parseSchema(JSON.parse(JSON.stringify(withManifest)))
if (!parsed.ok) fail(`El core rechaza el draft del builder: ${JSON.stringify(parsed.error[0])}`)
console.log('✓ El core acepta la gramática completa del builder (all/any/not/cmp/sum + visibleWhen)')

// 2. check(): solo debe quejarse de la página inalcanzable de control
const problems = parsed.ok ? flowGraphRuntime.check(parsed.value) : []
const errors = problems.filter((problem) => problem.severity === 'error')
if (errors.length !== 1 || errors[0]?.code !== 'unreachable-node') {
  fail(`Errores inesperados de check(): ${JSON.stringify(errors)}`)
}
console.log('✓ check() no ve problemas en los guards construidos')

// 3. Elegibilidad bien fundada
const plugins = flowGraphReactQuestionPlugins
const inSegunda = eligibleQuestions(schema, 'segunda').map(({ id }) => id)
if (!inSegunda.includes('nombre') || !inSegunda.includes('tipo') || !inSegunda.includes('extra')) {
  fail(`segunda debería ver sus preguntas y las de inicio: ${inSegunda.join(', ')}`)
}
if (inSegunda.includes('perdida')) fail('segunda no debería ver preguntas de una página no ancestra')

const visibilidadTipo = eligibleQuestions(schema, 'inicio', 1).map(({ id }) => id)
if (visibilidadTipo.join(',') !== 'nombre') {
  fail(`visibleWhen de «tipo» solo puede referenciar «nombre»: ${visibilidadTipo.join(', ')}`)
}
const visibilidadNombre = eligibleQuestions(schema, 'inicio', 0)
if (visibilidadNombre.length !== 0) {
  fail('la primera pregunta de la página inicial no debería tener referencias posibles')
}
console.log('✓ La elegibilidad respeta la regla de buena fundación')

// 4. Capacidades: tipos ofrecidos y operadores derivados de los plugins
const kinds = availableGuardKinds(plugins, eligibleQuestions(schema, 'inicio'))
for (const kind of ['always', 'answered', 'selected', 'cmp', 'all', 'any', 'not'] as const) {
  if (!kinds.has(kind)) fail(`El builder debería ofrecer «${kind}» en la página inicial`)
  const guard = defaultGuardForKind(kind, plugins, eligibleQuestions(schema, 'inicio'))
  if (!guard) fail(`defaultGuardForKind devolvió undefined para «${kind}»`)
}
const ops = operatorsForComparison(plugins, eligibleQuestions(schema, 'inicio'), {
  kind: 'score',
  q: 'tipo',
})
if (ops.length !== 6) fail(`El plugin select declara 6 operadores; llegaron ${ops.length}`)
console.log('✓ Tipos de condición y operadores derivados de las capacidades de los plugins')

// 5. Etiquetas legibles para guards complejos
const label = guardLabel(complexGuard, eligibleQuestions(schema, 'segunda'))
if (!label.includes('Tipo = A') || !label.includes('suma(')) {
  fail(`Etiqueta ilegible para el guard complejo: ${label}`)
}
console.log(`✓ Etiqueta del guard complejo: ${label}`)

console.log('✓ Verificación completa: builder y core están alineados')
process.exit(0)
