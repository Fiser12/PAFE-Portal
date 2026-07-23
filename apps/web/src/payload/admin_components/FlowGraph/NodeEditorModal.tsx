'use client'

import { toQuestionId, type QuestionDefinition } from 'flowgraph-core'
import type { ReactQuestionPluginRegistry } from 'flowgraph-react'
import React from 'react'

import type { NodeDraft, QuestionDraft, SchemaDraft } from './draft-types'
import { GuardBuilder } from './GuardBuilder'
import { defaultGuardForKind, eligibleQuestions, guardLabel } from './guards'
import { buttonStyle, dangerButtonStyle, fieldStyle } from './styles'

export const questionForKind = (
  plugins: ReactQuestionPluginRegistry,
  kind: QuestionDraft['kind'],
  id: string,
  label = 'Nueva pregunta',
): QuestionDraft => {
  const plugin = plugins.get(kind)
  if (plugin === undefined) throw new Error(`Plugin de pregunta no registrado: ${kind}`)
  const question = plugin.core.createDefault({
    id: toQuestionId(id),
    text: { key: `question.${id}`, fallback: label },
  })
  return JSON.parse(JSON.stringify({ ...question, required: false })) as QuestionDraft
}

const InlineQuestion = ({
  question,
  questionPlugins,
  referencableQuestions,
  update,
  remove,
}: {
  question: QuestionDraft
  update: (question: QuestionDraft) => void
  remove: () => void
  questionPlugins: ReactQuestionPluginRegistry
  /** Preguntas anteriores + de páginas ancestras: candidatas para visibleWhen */
  referencableQuestions: readonly QuestionDraft[]
}) => {
  const plugin = questionPlugins.get(question.kind)
  const parsed = plugin?.core.questionSchema.safeParse(question)
  const PluginEditor = plugin?.QuestionEditor
  const defaultVisibility = defaultGuardForKind('answered', questionPlugins, referencableQuestions)

  return (
    <div
      className="nodrag nopan"
      style={{
        display: 'grid',
        gap: '7px',
        padding: '9px',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '7px',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 105px auto', gap: '6px' }}>
        <input
          aria-label={`Texto de ${question.id}`}
          style={fieldStyle}
          value={question.text.fallback}
          onChange={(event) =>
            update({ ...question, text: { ...question.text, fallback: event.target.value } })
          }
        />
        <select
          aria-label={`Tipo de ${question.id}`}
          style={fieldStyle}
          value={question.kind}
          onChange={(event) =>
            update({
              ...questionForKind(
                questionPlugins,
                event.target.value as QuestionDraft['kind'],
                question.id,
                question.text.fallback,
              ),
              required: question.required,
              visibleWhen: question.visibleWhen,
            })
          }
        >
          {questionPlugins.list().map((questionPlugin) => (
            <option key={questionPlugin.core.kind} value={questionPlugin.core.kind}>
              {questionPlugin.label}
            </option>
          ))}
        </select>
        <button type="button" style={dangerButtonStyle} onClick={remove} aria-label="Eliminar pregunta">
          ×
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
        <code>{question.id}</code>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="checkbox"
            checked={question.required ?? false}
            onChange={(event) => update({ ...question, required: event.target.checked })}
          />
          Obligatoria
        </label>
      </div>

      {PluginEditor && parsed?.success ? (
        <PluginEditor
          question={parsed.data as QuestionDefinition}
          problems={[]}
          disabled={false}
          resolveText={(text) => text.fallback}
          onChange={(next) =>
            update({
              ...(JSON.parse(JSON.stringify(next)) as QuestionDraft),
              visibleWhen: question.visibleWhen,
            })
          }
        />
      ) : (
        <p style={{ margin: 0, color: 'var(--theme-error-600)', fontSize: '11px' }}>
          La configuración de esta pregunta no es válida para su plugin.
        </p>
      )}

      {question.visibleWhen === undefined ? (
        <button
          type="button"
          style={{ ...buttonStyle, justifySelf: 'start', fontSize: '11px' }}
          disabled={defaultVisibility === undefined}
          title={
            defaultVisibility === undefined
              ? 'Necesita preguntas anteriores o de páginas previas que referenciar'
              : undefined
          }
          onClick={() => {
            if (defaultVisibility) update({ ...question, visibleWhen: defaultVisibility })
          }}
        >
          + Condición de visibilidad
        </button>
      ) : (
        <div style={{ display: 'grid', gap: '5px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              fontSize: '11px',
            }}
          >
            <span>
              Visible solo si: <em>{guardLabel(question.visibleWhen, referencableQuestions)}</em>
            </span>
            <button
              type="button"
              style={{ ...dangerButtonStyle, fontSize: '11px' }}
              onClick={() => {
                const { visibleWhen: _visibleWhen, ...rest } = question
                update(rest)
              }}
            >
              Quitar condición
            </button>
          </div>
          <GuardBuilder
            guard={question.visibleWhen}
            onChange={(visibleWhen) => update({ ...question, visibleWhen })}
            plugins={questionPlugins}
            questions={referencableQuestions}
            allowAlways={false}
          />
        </div>
      )}
    </div>
  )
}

export const NodeEditorModal = ({
  questionPlugins,
  schema,
  nodeID,
  node,
  entry,
  canDelete,
  update,
  makeEntry,
  remove,
  close,
  createQuestionID,
  pageContentEditor,
}: {
  questionPlugins: ReactQuestionPluginRegistry
  schema: SchemaDraft
  nodeID: string
  node: NodeDraft
  entry: boolean
  canDelete: boolean
  update: (node: NodeDraft) => void
  makeEntry: () => void
  remove: () => void
  close: () => void
  createQuestionID: () => string
  pageContentEditor?: React.ReactNode
}) => (
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
      aria-label={`Editar ${nodeID}`}
      style={{
        width: 'min(760px, 100%)',
        maxHeight: 'calc(100vh - 48px)',
        overflow: 'auto',
        padding: '18px',
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
          marginBottom: '16px',
        }}
      >
        <div>
          <strong>Editar {node.kind === 'page' ? 'página' : 'resultado'}</strong>
          <code style={{ display: 'block', marginTop: '3px', fontSize: '11px', opacity: 0.65 }}>
            {nodeID}
          </code>
        </div>
        <button type="button" style={buttonStyle} onClick={close}>
          Cerrar
        </button>
      </header>

      {node.kind === 'terminal' ? (
        <label style={{ display: 'grid', gap: '5px', fontSize: '12px' }}>
          Resultado
          <input
            style={{ ...fieldStyle, fontSize: '14px' }}
            value={node.outcome}
            onChange={(event) => update({ ...node, outcome: event.target.value })}
          />
        </label>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
            <label style={{ display: 'grid', gap: '5px', fontSize: '12px' }}>
              Título de la página
              <input
                style={{ ...fieldStyle, fontSize: '14px' }}
                value={node.title?.fallback ?? ''}
                onChange={(event) =>
                  update({
                    ...node,
                    title: {
                      key: node.title?.key ?? `page.${nodeID}.title`,
                      fallback: event.target.value,
                    },
                  })
                }
              />
            </label>
            <button type="button" style={buttonStyle} onClick={makeEntry} disabled={entry}>
              {entry ? 'Página inicial' : 'Hacer página inicial'}
            </button>
          </div>

          {pageContentEditor}

          <strong>Preguntas</strong>
          {node.questions.length === 0 && (
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
              Esta página todavía no tiene preguntas.
            </p>
          )}
          {node.questions.map((question, questionIndex) => (
            <InlineQuestion
              key={question.id}
              question={question}
              questionPlugins={questionPlugins}
              referencableQuestions={eligibleQuestions(schema, nodeID, questionIndex)}
              update={(updated) => {
                const questions = [...node.questions]
                questions[questionIndex] = updated
                update({ ...node, questions })
              }}
              remove={() =>
                update({
                  ...node,
                  questions: node.questions.filter((_, index) => index !== questionIndex),
                })
              }
            />
          ))}
          <button
            type="button"
            style={buttonStyle}
            onClick={() => {
              const questionID = createQuestionID()
              update({
                ...node,
                questions: [
                  ...node.questions,
                  questionForKind(questionPlugins, 'text', questionID),
                ],
              })
            }}
          >
            + Añadir pregunta
          </button>
        </div>
      )}

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '18px',
          paddingTop: '14px',
          borderTop: '1px solid var(--theme-elevation-150)',
        }}
      >
        <button
          type="button"
          style={dangerButtonStyle}
          disabled={!canDelete}
          onClick={() => {
            remove()
            close()
          }}
        >
          Eliminar nodo
        </button>
        <button type="button" style={buttonStyle} onClick={close}>
          Listo
        </button>
      </footer>
    </section>
  </div>
)
