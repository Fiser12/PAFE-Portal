/**
 * Traducción de los diagnósticos del runtime a mensajes para quien edita
 * contenido, con el lugar afectado en lenguaje de la interfaz (página,
 * pregunta, flecha) en vez del JSON crudo del problema.
 */
const MESSAGES: Record<string, string> = {
  'missing-entry': 'La página inicial apunta a un nodo que no existe.',
  'entry-not-page': 'El inicio del flujo debe ser una página, no un resultado.',
  'dangling-node': 'Una flecha apunta a un nodo que no existe.',
  'unreachable-node': 'No se puede llegar a este nodo desde la página inicial.',
  'no-terminal-reachable': 'Desde esta página no se llega a ningún resultado final.',
  'cycle-detected': 'El flujo tiene un ciclo: una flecha vuelve a una página anterior.',
  'duplicate-question': 'Hay dos preguntas con el mismo identificador.',
  'duplicate-option': 'Hay dos opciones con el mismo identificador en la misma pregunta.',
  'duplicate-edge-target': 'Hay dos flechas hacia el mismo destino; combínalas en una.',
  'shadowed-edge': 'Esta flecha nunca se usará: hay una ruta por defecto antes que ella.',
  'ill-founded-visibility':
    'La condición de visibilidad referencia una pregunta posterior; solo puede usar preguntas anteriores.',
  'invalid-expression-reference':
    'La condición referencia una pregunta que no existe, es posterior, o no admite ese tipo de condición.',
  'invalid-constraint': 'La configuración de esta pregunta no es válida.',
  'missing-default-edge':
    'Esta página no tiene ruta por defecto («Siempre»); algún caso podría quedarse sin salida.',
  'empty-all': 'Una condición «Todas (Y)» está vacía; se cumple siempre.',
  'empty-any': 'Una condición «Alguna (O)» está vacía; no se cumple nunca.',
  'weight-overflow-risk': 'Los pesos de las opciones son tan grandes que la puntuación podría desbordarse.',
  'probe-budget-exceeded': 'El flujo es demasiado complejo para verificarlo automáticamente.',
  'semantic-dead-end': 'Hay una combinación válida de respuestas que se queda sin ruta de salida.',
  'unknown-option': 'La condición referencia una opción que ya no existe.',
  'arity-mismatch': 'La pregunta no admite varias respuestas.',
}

type ProblemLike = {
  code: string
  where?: Readonly<Record<string, string | number>>
}

const wherePart = (where: ProblemLike['where']): string => {
  if (!where) return ''
  const parts: string[] = []
  if (typeof where.node === 'string') parts.push(`página «${where.node}»`)
  if (typeof where.question === 'string') parts.push(`pregunta «${where.question}»`)
  if (typeof where.edge === 'number') parts.push(`flecha ${where.edge + 1}`)
  if (typeof where.to === 'string') parts.push(`hacia «${where.to}»`)
  return parts.length > 0 ? ` — ${parts.join(', ')}` : ''
}

export const describeProblem = (problem: ProblemLike): string => {
  const message = MESSAGES[problem.code] ?? `Problema del flujo: ${problem.code}`
  return `${message}${wherePart(problem.where)}`
}
