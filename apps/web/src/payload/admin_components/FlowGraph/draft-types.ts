export type TextRefDraft = { key: string; fallback: string }

export type GuardDraft =
  | { kind: 'always' }
  | { kind: 'answered'; q: string }
  | { kind: 'selected'; q: string; option: string }

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
