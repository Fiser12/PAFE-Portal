import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const payloadUI = vi.hoisted(() => ({
  addFieldRow: vi.fn(),
  contentValue: undefined as unknown,
  fields: [] as Record<string, unknown>[],
  rows: [] as { isLoading?: boolean }[],
  setValue: vi.fn(),
  values: undefined as Record<string, unknown>[] | undefined,
}))

vi.mock('@payloadcms/ui', async () => {
  const React = await import('react')
  return {
    RenderFields: ({ parentPath }: { parentPath: string }) =>
      React.createElement('div', { 'data-testid': 'render-fields' }, parentPath),
    useConfig: () => ({
      getEntityConfig: () => ({ fields: payloadUI.fields }),
    }),
    useField: ({ hasRows }: { hasRows?: boolean }) =>
      hasRows
        ? { rows: payloadUI.rows }
        : { value: payloadUI.contentValue, setValue: payloadUI.setValue },
    useForm: () => ({
      addFieldRow: payloadUI.addFieldRow,
      getDataByPath: () => payloadUI.values,
    }),
  }
})

import { FlowGraphLexicalPageEditor } from '../src/client'

const configureField = () => {
  payloadUI.fields = [
    {
      name: 'pageContents',
      type: 'array',
      fields: [{ name: 'content', type: 'richText' }],
    },
  ]
}

describe('FlowGraphLexicalPageEditor', () => {
  afterEach(cleanup)

  beforeEach(() => {
    payloadUI.addFieldRow.mockReset()
    payloadUI.setValue.mockReset()
    payloadUI.contentValue = undefined
    payloadUI.fields = []
    payloadUI.rows = []
    payloadUI.values = undefined
  })

  it('reports a missing Payload field configuration with host labels', () => {
    render(
      <FlowGraphLexicalPageEditor
        collectionSlug="questionnaires"
        nodeID="first"
        labels={{ configurationError: 'Configuración ausente' }}
      />,
    )
    expect(screen.getByText('Configuración ausente')).toBeTruthy()
  })

  it('adds a valid native Lexical row for a page that has no content yet', async () => {
    configureField()
    render(
      <FlowGraphLexicalPageEditor
        collectionSlug="questionnaires"
        nodeID="first"
        labels={{ preparing: 'Preparando…' }}
      />,
    )

    expect(screen.getByText('Preparando…')).toBeTruthy()
    await waitFor(() => expect(payloadUI.addFieldRow).toHaveBeenCalledOnce())
    expect(payloadUI.addFieldRow.mock.calls[0]?.[0]).toMatchObject({
      path: 'pageContents',
      schemaPath: 'pageContents',
      subFieldState: {
        pageID: { value: 'first' },
        content: { value: { root: { children: [{ type: 'paragraph' }] } } },
      },
    })
  })

  it('waits while Payload hydrates a newly inserted array row', () => {
    configureField()
    payloadUI.values = [{ pageID: 'first' }]
    payloadUI.rows = [{ isLoading: true }]
    render(<FlowGraphLexicalPageEditor collectionSlug="questionnaires" nodeID="first" />)
    expect(screen.getByText('Preparing content…')).toBeTruthy()
    expect(screen.queryByTestId('render-fields')).toBeNull()
  })

  it('renders the configured rich-text field for an existing page', () => {
    configureField()
    payloadUI.values = [{ pageID: 'first' }]
    payloadUI.rows = [{}]
    payloadUI.contentValue = { root: { children: [{ type: 'paragraph' }] } }
    render(<FlowGraphLexicalPageEditor collectionSlug="questionnaires" nodeID="first" />)
    expect(screen.getByText('Page content')).toBeTruthy()
    expect(screen.getByTestId('render-fields').textContent).toBe('pageContents.0')
  })

  it('repairs legacy documents whose Lexical root is empty before rendering', async () => {
    configureField()
    payloadUI.values = [{ pageID: 'first' }]
    payloadUI.rows = [{}]
    payloadUI.contentValue = { root: { children: [] } }
    render(<FlowGraphLexicalPageEditor collectionSlug="questionnaires" nodeID="first" />)

    expect(screen.getByText('Preparing content…')).toBeTruthy()
    expect(screen.queryByTestId('render-fields')).toBeNull()
    await waitFor(() => expect(payloadUI.setValue).toHaveBeenCalledOnce())
    expect(payloadUI.setValue.mock.calls[0]?.[0]).toMatchObject({
      root: { children: [{ type: 'paragraph' }] },
    })
  })
})
