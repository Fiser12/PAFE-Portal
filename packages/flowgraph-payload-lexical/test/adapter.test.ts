import {
  toNodeId,
  toOutcomeId,
  toSchemaId,
  toSchemaVersion,
  type FlowSchema,
  type FlowState,
} from 'flowgraph-core'
import { describe, expect, it } from 'vitest'

import {
  createEmptyLexicalEditorState,
  createFlowGraphLexicalPageContentsField,
  currentFlowGraphLexicalPageContent,
  hasEmptyLexicalRoot,
  reconcileFlowGraphLexicalPageContents,
} from '../src/index'

const schema: FlowSchema = {
  id: toSchemaId('adapter-test'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('first'),
  nodes: {
    [toNodeId('first')]: { kind: 'page', questions: [], edges: [] },
    [toNodeId('second')]: { kind: 'page', questions: [], edges: [] },
    [toNodeId('done')]: { kind: 'terminal', outcome: toOutcomeId('done') },
  },
}

describe('Payload Lexical adapter', () => {
  it('creates a valid non-empty Lexical document and detects legacy empty roots', () => {
    const state = createEmptyLexicalEditorState()
    expect(state.root.children).toHaveLength(1)
    expect(state.root.children[0]?.type).toBe('paragraph')
    expect(hasEmptyLexicalRoot({ root: { children: [] } })).toBe(true)
    expect(hasEmptyLexicalRoot(state)).toBe(false)
    expect(hasEmptyLexicalRoot(null)).toBe(false)
    expect(hasEmptyLexicalRoot({ root: null })).toBe(false)
    expect(hasEmptyLexicalRoot({ root: {} })).toBe(false)
  })

  it('creates the hidden Payload field with configurable names', () => {
    const editor = {} as never
    const field = createFlowGraphLexicalPageContentsField({
      editor,
      name: 'copy',
      pageIDFieldName: 'node',
      contentFieldName: 'body',
      label: 'Page copy',
    })
    expect(field).toMatchObject({
      name: 'copy',
      label: 'Page copy',
      type: 'array',
      admin: { hidden: true },
      fields: [
        { name: 'node', type: 'text', required: true },
        { name: 'body', type: 'richText', editor },
      ],
    })
  })

  it('keeps one content row per existing page and drops malformed, terminal and duplicate rows', () => {
    const first = { pageID: 'first', content: { value: 1 } }
    expect(
      reconcileFlowGraphLexicalPageContents(schema, [
        null,
        { pageID: 3 },
        { pageID: 'done' },
        first,
        { pageID: 'first', content: { value: 2 } },
        { pageID: 'second' },
      ]),
    ).toEqual([first, { pageID: 'second' }])
    expect(reconcileFlowGraphLexicalPageContents(schema, null)).toEqual([])
  })

  it('supports a custom page ID field and resolves the active page content', () => {
    const rows = reconcileFlowGraphLexicalPageContents(
      schema,
      [{ node: 'first', content: 'one' }],
      { pageIDFieldName: 'node' },
    )
    expect(rows).toEqual([{ node: 'first', content: 'one' }])

    const pageContents = [
      { pageID: 'first', content: 'one' },
      { pageID: 'second', content: 'two' },
    ]
    const state: FlowState = {
      status: 'active',
      schemaId: schema.id,
      schemaVersion: schema.version,
      trail: [toNodeId('first'), toNodeId('second')],
      answers: {},
    }
    expect(currentFlowGraphLexicalPageContent(state, pageContents)).toEqual(pageContents[1])
    expect(currentFlowGraphLexicalPageContent({ ...state, trail: [] }, pageContents)).toBeUndefined()
    expect(currentFlowGraphLexicalPageContent(state, null)).toBeUndefined()
  })
})
