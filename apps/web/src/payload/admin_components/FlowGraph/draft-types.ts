export type TextRefDraft = { key: string; fallback: string }

/** Guards que el editor visual sabe crear y editar */
export type BasicGuardDraft =
  | { kind: 'always' }
  | { kind: 'answered'; q: string }
  | { kind: 'selected'; q: string; option: string }

/**
 * Guards del core que el editor visual todavía no representa (not/all/any/cmp).
 * Se muestran como "condición avanzada" y se preservan intactos: solo la
 * pestaña de JSON puede modificarlos.
 */
export type AdvancedGuardDraft = { kind: 'not' | 'all' | 'any' | 'cmp' } & Record<string, unknown>

export type GuardDraft = BasicGuardDraft | AdvancedGuardDraft

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
  /** Visibilidad condicional del core; el editor la preserva pero aún no la edita */
  visibleWhen?: unknown
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
