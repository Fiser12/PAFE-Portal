import type { QuestionConditionCapability } from 'flowgraph-core'
import type { ReactQuestionPluginRegistry } from 'flowgraph-react'

import type {
  ComparisonOpDraft,
  GuardDraft,
  NumericExprDraft,
  QuestionDraft,
  SchemaDraft,
} from './draft-types'

export const COMPARISON_SYMBOLS: Record<ComparisonOpDraft, string> = {
  eq: '=',
  ne: '≠',
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
}

export const ALL_OPERATORS: readonly ComparisonOpDraft[] = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte']

export const questionLabel = (question: QuestionDraft | undefined): string =>
  question?.text.fallback || question?.id || 'Pregunta'

const findQuestion = (questions: readonly QuestionDraft[], id: string) =>
  questions.find((question) => question.id === id)

const numericLabel = (expr: NumericExprDraft, questions: readonly QuestionDraft[]): string => {
  switch (expr.kind) {
    case 'num':
      return String(expr.value)
    case 'answer':
      return `respuesta de «${questionLabel(findQuestion(questions, expr.q))}»`
    case 'score':
      return `puntuación de «${questionLabel(findQuestion(questions, expr.q))}»`
    case 'sum':
      return `suma(${expr.values.map((value) => numericLabel(value, questions)).join(' + ')})`
  }
}

export const guardLabel = (guard: GuardDraft, questions: readonly QuestionDraft[]): string => {
  switch (guard.kind) {
    case 'always':
      return 'Siempre'
    case 'answered':
      return `Respondida: ${questionLabel(findQuestion(questions, guard.q))}`
    case 'selected': {
      const question = findQuestion(questions, guard.q)
      const option = question?.options?.find(({ id }) => id === guard.option)
      return `${questionLabel(question)} = ${option?.text.fallback ?? guard.option}`
    }
    case 'not':
      return `NO (${guardLabel(guard.value, questions)})`
    case 'all':
      return guard.values.length === 0
        ? 'Todas (vacía)'
        : guard.values.map((value) => `(${guardLabel(value, questions)})`).join(' Y ')
    case 'any':
      return guard.values.length === 0
        ? 'Alguna (vacía)'
        : guard.values.map((value) => `(${guardLabel(value, questions)})`).join(' O ')
    case 'cmp':
      return `${numericLabel(guard.left, questions)} ${COMPARISON_SYMBOLS[guard.op]} ${numericLabel(guard.right, questions)}`
  }
}

/**
 * Preguntas que un guard puede referenciar sin romper la regla de buena
 * fundación del core: las de la propia página (todas para edges; solo las
 * anteriores para visibleWhen) más las de páginas ancestras estrictas.
 */
export const eligibleQuestions = (
  schema: SchemaDraft,
  pageID: string,
  uptoIndex?: number,
): QuestionDraft[] => {
  const page = schema.nodes[pageID]
  const own =
    page?.kind === 'page'
      ? uptoIndex === undefined
        ? page.questions
        : page.questions.slice(0, uptoIndex)
      : []

  // Ancestros: BFS sobre la adyacencia inversa desde la página objetivo
  const predecessors = new Map<string, string[]>()
  for (const [nodeID, node] of Object.entries(schema.nodes)) {
    if (node.kind !== 'page') continue
    for (const edge of node.edges) {
      predecessors.set(edge.to, [...(predecessors.get(edge.to) ?? []), nodeID])
    }
  }
  const ancestors = new Set<string>()
  const queue = [...(predecessors.get(pageID) ?? [])]
  while (queue.length > 0) {
    const nodeID = queue.pop() as string
    if (ancestors.has(nodeID) || nodeID === pageID) continue
    ancestors.add(nodeID)
    queue.push(...(predecessors.get(nodeID) ?? []))
  }

  const inherited = [...ancestors].flatMap((nodeID) => {
    const node = schema.nodes[nodeID]
    return node?.kind === 'page' ? node.questions : []
  })

  return [...own, ...inherited]
}

export const capabilitiesFor = (
  plugins: ReactQuestionPluginRegistry,
  question: QuestionDraft,
): readonly QuestionConditionCapability[] => {
  const plugin = plugins.get(question.kind)
  const parsed = plugin?.core.questionSchema.safeParse(question)
  if (!plugin || !parsed?.success) return []
  return plugin.core.conditions(parsed.data)
}

export const selectableOptions = (plugins: ReactQuestionPluginRegistry, question: QuestionDraft) => {
  const capability = capabilitiesFor(plugins, question).find(
    (candidate) => candidate.kind === 'selected',
  )
  return capability?.kind === 'selected' ? capability.options : []
}

export const supportsAnswered = (
  plugins: ReactQuestionPluginRegistry,
  question: QuestionDraft,
): boolean => capabilitiesFor(plugins, question).some((capability) => capability.kind === 'answered')

export const compareCapability = (
  plugins: ReactQuestionPluginRegistry,
  question: QuestionDraft,
  source: 'answer' | 'score',
) => {
  const capability = capabilitiesFor(plugins, question).find(
    (candidate) => candidate.kind === 'compare' && candidate.source === source,
  )
  return capability?.kind === 'compare' ? capability : undefined
}

/** Operadores ofrecidos: intersección de los declarados por los operandos con pregunta */
export const operatorsForComparison = (
  plugins: ReactQuestionPluginRegistry,
  questions: readonly QuestionDraft[],
  ...operands: NumericExprDraft[]
): readonly ComparisonOpDraft[] => {
  const sets: (readonly ComparisonOpDraft[])[] = []
  const visit = (expr: NumericExprDraft): void => {
    if (expr.kind === 'answer' || expr.kind === 'score') {
      const question = findQuestion(questions, expr.q)
      const capability = question ? compareCapability(plugins, question, expr.kind) : undefined
      if (capability) sets.push(capability.operators as readonly ComparisonOpDraft[])
    }
    if (expr.kind === 'sum') expr.values.forEach(visit)
  }
  operands.forEach(visit)
  if (sets.length === 0) return ALL_OPERATORS
  return ALL_OPERATORS.filter((op) => sets.every((set) => set.includes(op)))
}

/** Guard por defecto al elegir un tipo en el builder */
export const defaultGuardForKind = (
  kind: GuardDraft['kind'],
  plugins: ReactQuestionPluginRegistry,
  questions: readonly QuestionDraft[],
): GuardDraft | undefined => {
  const answerable = questions.find((question) => supportsAnswered(plugins, question))
  switch (kind) {
    case 'always':
      return { kind }
    case 'answered':
      return answerable ? { kind, q: answerable.id } : undefined
    case 'selected': {
      const question = questions.find(
        (candidate) => selectableOptions(plugins, candidate).length > 0,
      )
      const option = question ? selectableOptions(plugins, question)[0] : undefined
      return question && option ? { kind, q: question.id, option: option.id } : undefined
    }
    case 'cmp': {
      const left = defaultNumericOperand(plugins, questions)
      return left ? { kind, op: 'gte', left, right: { kind: 'num', value: 1 } } : undefined
    }
    case 'not': {
      const inner = defaultGuardForKind('answered', plugins, questions)
      return inner ? { kind, value: inner } : undefined
    }
    case 'all':
    case 'any': {
      const inner = defaultGuardForKind('answered', plugins, questions)
      return inner ? { kind, values: [inner] } : undefined
    }
  }
}

export const defaultNumericOperand = (
  plugins: ReactQuestionPluginRegistry,
  questions: readonly QuestionDraft[],
): NumericExprDraft | undefined => {
  for (const source of ['score', 'answer'] as const) {
    const question = questions.find((candidate) => compareCapability(plugins, candidate, source))
    if (question) return { kind: source, q: question.id }
  }
  return undefined
}

/** Un tipo de guard es ofrecible si existe al menos una construcción válida */
export const availableGuardKinds = (
  plugins: ReactQuestionPluginRegistry,
  questions: readonly QuestionDraft[],
): ReadonlySet<GuardDraft['kind']> => {
  const kinds: GuardDraft['kind'][] = ['always', 'answered', 'selected', 'cmp', 'not', 'all', 'any']
  return new Set(kinds.filter((kind) => defaultGuardForKind(kind, plugins, questions) !== undefined))
}
