export type TextRefDraft = { key: string; fallback: string }

export type ComparisonOpDraft = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'

export type NumericExprDraft =
  | { kind: 'num'; value: number }
  | { kind: 'answer'; q: string }
  | { kind: 'score'; q: string }
  | { kind: 'sum'; values: NumericExprDraft[] }

/** Gramática completa de guards del core; el builder visual la cubre entera */
export type GuardDraft =
  | { kind: 'always' }
  | { kind: 'answered'; q: string }
  | { kind: 'selected'; q: string; option: string }
  | { kind: 'not'; value: GuardDraft }
  | { kind: 'all'; values: GuardDraft[] }
  | { kind: 'any'; values: GuardDraft[] }
  | { kind: 'cmp'; op: ComparisonOpDraft; left: NumericExprDraft; right: NumericExprDraft }

export type OptionDraft = { id: string; text: TextRefDraft; weight?: number }

export type QuestionDraft = {
  id: string
  kind: 'text' | 'number' | 'select'
  text: TextRefDraft
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
  multiple?: boolean
  options?: OptionDraft[]
  visibleWhen?: GuardDraft
}

export type EdgeDraft = { to: string; when: GuardDraft }

export type PageDraft = {
  kind: 'page'
  title?: TextRefDraft
  questions: QuestionDraft[]
  edges: EdgeDraft[]
}

export type TerminalDraft = { kind: 'terminal'; outcome: string }
export type NodeDraft = PageDraft | TerminalDraft

export type SchemaDraft = {
  id: string
  version: string
  questionPlugins?: Record<string, string>
  entry: string
  nodes: Record<string, NodeDraft>
}

export type LayoutDraft = Record<string, { x: number; y: number }>
