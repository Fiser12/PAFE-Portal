'use client'

import { QuestionnaireRichText } from '@/components/questionnaires/QuestionnaireRichText'
import { flowGraphReactQuestionPlugins } from '@/lib/flowgraph/react'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { hashSchema, toSafeInt, type CommandMeta, type FlowSchema } from 'flowgraph-core'
import { currentFlowGraphLexicalPageContent } from 'flowgraph-payload-lexical'
import { FlowPage, useFlowSurvey } from 'flowgraph-react'
import { createSession, type FlowSession } from 'flowgraph-session'
import React, { useMemo, useState } from 'react'

import { buttonStyle } from './styles'

const createMeta = (): CommandMeta => ({
  at: toSafeInt(Date.now()),
  source: 'human',
  path: [],
})

type ViewportPreset = { label: string; width: string }

const VIEWPORTS: ViewportPreset[] = [
  { label: 'Móvil', width: '390px' },
  { label: 'Tablet', width: '744px' },
  { label: 'Escritorio', width: '100%' },
]

type PageContentLike = { pageID: string; content?: DefaultTypedEditorState | null }

const PreviewRunner = ({
  schema,
  session,
  pageContents,
}: {
  schema: FlowSchema
  session: FlowSession
  pageContents: PageContentLike[]
}) => {
  const controller = useFlowSurvey({
    runtime: flowGraphRuntime,
    schema,
    session,
    createMeta,
  })
  const currentContent = currentFlowGraphLexicalPageContent(
    controller.state,
    pageContents,
  )?.content

  if (controller.state.status === 'finished') {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>Cuestionario completado</p>
        <p style={{ margin: '8px 0 0', fontSize: '18px' }}>
          Resultado: <strong>{controller.state.outcome}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="flowgraph-pafe">
      <FlowPage
        controller={controller}
        questionPlugins={flowGraphReactQuestionPlugins}
        nextLabel="Continuar"
        backLabel="Atrás"
        beforeQuestions={
          currentContent ? <QuestionnaireRichText data={currentContent} /> : undefined
        }
      />
    </div>
  )
}

export const PreviewModal = ({
  schemaValue,
  pageContents,
  close,
}: {
  /** Valor actual (sin guardar) del campo schema */
  schemaValue: unknown
  pageContents?: unknown
  close: () => void
}) => {
  const [viewport, setViewport] = useState<ViewportPreset>(VIEWPORTS[2]!)
  const [attempt, setAttempt] = useState(0)

  const parsed = useMemo(() => flowGraphRuntime.parseSchema(schemaValue), [schemaValue])

  // La sesión usa el runtime de producción; `attempt` fuerza el reinicio
  const session = useMemo(() => {
    if (!parsed.ok) return undefined
    const created = createSession(flowGraphRuntime, parsed.value, undefined, {
      onListenerError: (failures) => console.error('Preview listener failed:', failures),
    })
    if (!created.ok) return undefined
    created.value.dispatch({
      kind: 'START',
      schemaHash: hashSchema(parsed.value),
      meta: createMeta(),
    })
    return created.value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, attempt])

  const contents = useMemo<PageContentLike[]>(
    () =>
      Array.isArray(pageContents)
        ? (pageContents.filter(
            (entry): entry is PageContentLike =>
              typeof entry === 'object' && entry !== null && 'pageID' in entry,
          ) as PageContentLike[])
        : [],
    [pageContents],
  )

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'color-mix(in srgb, var(--theme-elevation-900) 45%, transparent)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Probar borrador del cuestionario"
        style={{
          width: 'min(960px, 100%)',
          maxHeight: 'calc(100vh - 48px)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          border: '1px solid var(--theme-elevation-250)',
          borderRadius: '12px',
          background: 'var(--theme-elevation-0)',
          color: 'var(--theme-elevation-800)',
          boxShadow: '0 20px 60px color-mix(in srgb, var(--theme-elevation-900) 28%, transparent)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid var(--theme-elevation-150)',
          }}
        >
          <strong>Probar borrador</strong>
          <div style={{ display: 'flex', gap: '6px' }}>
            {VIEWPORTS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                style={{
                  ...buttonStyle,
                  ...(viewport.label === preset.label
                    ? { background: 'var(--theme-elevation-200)' }
                    : {}),
                }}
                onClick={() => setViewport(preset)}
              >
                {preset.label}
              </button>
            ))}
            <button type="button" style={buttonStyle} onClick={() => setAttempt((n) => n + 1)}>
              Reiniciar
            </button>
            <button type="button" style={buttonStyle} onClick={close}>
              Cerrar
            </button>
          </div>
        </header>

        <div style={{ overflow: 'auto', padding: '20px', background: 'var(--theme-elevation-50)' }}>
          {!parsed.ok ? (
            <p style={{ margin: 0, color: 'var(--theme-error-600)' }}>
              El borrador no es un flujo válido; corrígelo antes de probarlo.
            </p>
          ) : !session ? (
            <p style={{ margin: 0, color: 'var(--theme-error-600)' }}>
              No se ha podido iniciar la sesión de prueba.
            </p>
          ) : (
            <div
              style={{
                width: viewport.width,
                maxWidth: '100%',
                margin: '0 auto',
                padding: '20px',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '12px',
                background: 'var(--theme-elevation-0)',
              }}
            >
              <PreviewRunner
                key={attempt}
                schema={parsed.value}
                session={session}
                pageContents={contents}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
