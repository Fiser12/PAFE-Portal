'use client'

import { createDefaultFlowSchema } from '@/lib/flowgraph/defaultSchema'
import { flowGraphReactQuestionPlugins } from '@/lib/flowgraph/react'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { useField } from '@payloadcms/ui'
import { FlowGraphLexicalPageEditor } from 'flowgraph-payload-lexical/client'
import type { JSONFieldClientComponent } from 'payload'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { describeProblem } from './diagnostics'
import type { LayoutDraft, SchemaDraft } from './draft-types'
import { FlowGraphCanvas } from './GraphCanvas'
import { PreviewModal } from './PreviewModal'
import { buttonStyle } from './styles'

const cloneSchema = (value: unknown): SchemaDraft => {
  const parsed = flowGraphRuntime.parseSchema(value)
  const source = parsed.ok ? parsed.value : createDefaultFlowSchema()
  return JSON.parse(JSON.stringify(source)) as SchemaDraft
}

export const FlowGraphField: JSONFieldClientComponent = ({ path }) => {
  const schemaField = useField<unknown>({ path })
  const titleField = useField<string>({ path: 'title' })
  const descriptionField = useField<string>({ path: 'description' })
  const layoutField = useField<LayoutDraft | null>({ path: 'editorLayout' })
  const pageContentsField = useField<unknown>({ path: 'pageContents' })
  const [tab, setTab] = useState<'graph' | 'json'>('graph')
  const [previewing, setPreviewing] = useState(false)
  const [jsonDraft, setJsonDraft] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const schema = useMemo(() => cloneSchema(schemaField.value), [schemaField.value])

  useEffect(() => {
    setJsonDraft(JSON.stringify(schemaField.value ?? createDefaultFlowSchema(), null, 2))
  }, [schemaField.value])

  const diagnostics = useMemo(() => {
    const parsed = flowGraphRuntime.parseSchema(schemaField.value)
    if (!parsed.ok) {
      return parsed.error.map((problem) => ({
        severity: 'error' as const,
        text: `El JSON no es válido en ${problem.path.join('.') || 'la raíz'}`,
      }))
    }
    return flowGraphRuntime.check(parsed.value).map((problem) => ({
      severity: problem.severity,
      text: describeProblem(problem),
    }))
  }, [schemaField.value])

  const commit = useCallback(
    (next: SchemaDraft) => {
      schemaField.setValue({
        ...next,
        questionPlugins: flowGraphRuntime.questionPluginManifest,
      })
    },
    [schemaField],
  )

  const applyJSON = () => {
    try {
      const candidate: unknown = JSON.parse(jsonDraft)
      const parsed = flowGraphRuntime.parseSchema(candidate)
      if (!parsed.ok) {
        setJsonError(`JSON FlowGraph inválido: ${parsed.error[0]?.path.join('.') || 'raíz'}`)
        return
      }
      schemaField.setValue(flowGraphRuntime.withQuestionPluginManifest(parsed.value))
      setJsonError(null)
      setTab('graph')
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'JSON inválido')
    }
  }

  return (
    <div className="field-type json">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '10px' }}>
        <button type="button" style={buttonStyle} onClick={() => setPreviewing(true)}>
          ▶ Probar
        </button>
        <button type="button" style={buttonStyle} onClick={() => setTab('graph')}>
          Grafo
        </button>
        <button type="button" style={buttonStyle} onClick={() => setTab('json')}>
          JSON avanzado
        </button>
      </div>

      {tab === 'json' ? (
        <div
          style={{
            padding: '16px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: 'var(--style-radius-m)',
            background: 'var(--theme-elevation-50)',
          }}
        >
          <textarea
            aria-label="JSON de FlowGraph"
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '560px',
              padding: '10px',
              resize: 'vertical',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: 'var(--style-radius-s)',
              background: 'var(--theme-input-bg)',
              color: 'var(--theme-elevation-800)',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
          {jsonError && <p style={{ color: 'var(--theme-error-500)' }}>{jsonError}</p>}
          <button type="button" style={{ ...buttonStyle, marginTop: '10px' }} onClick={applyJSON}>
            Aplicar JSON
          </button>
        </div>
      ) : (
        <FlowGraphCanvas
          questionPlugins={flowGraphReactQuestionPlugins}
          schema={schema}
          title={titleField.value ?? ''}
          description={descriptionField.value ?? ''}
          diagnostics={diagnostics}
          layout={layoutField.value}
          onChange={commit}
          onTitleChange={titleField.setValue}
          onDescriptionChange={descriptionField.setValue}
          onLayoutChange={layoutField.setValue}
          renderPageContentEditor={(nodeID) => (
            <FlowGraphLexicalPageEditor
              collectionSlug="guided-questionnaires"
              nodeID={nodeID}
              labels={{
                title: 'Contenido de la página',
                preparing: 'Preparando contenido…',
                configurationError: 'No se ha podido cargar la configuración Lexical.',
              }}
            />
          )}
        />
      )}

      {previewing && (
        <PreviewModal
          schemaValue={schemaField.value ?? createDefaultFlowSchema()}
          pageContents={pageContentsField.value}
          close={() => setPreviewing(false)}
        />
      )}
    </div>
  )
}
