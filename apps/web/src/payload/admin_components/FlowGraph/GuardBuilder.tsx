'use client'

import type { ReactQuestionPluginRegistry } from 'flowgraph-react'
import React from 'react'

import type { ComparisonOpDraft, GuardDraft, NumericExprDraft, QuestionDraft } from './draft-types'
import {
  COMPARISON_SYMBOLS,
  compareCapability,
  defaultGuardForKind,
  defaultNumericOperand,
  availableGuardKinds,
  operatorsForComparison,
  questionLabel,
  selectableOptions,
  supportsAnswered,
} from './guards'

const fieldStyle: React.CSSProperties = {
  minHeight: '30px',
  padding: '4px 7px',
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-elevation-800)',
  fontSize: '11px',
}

const smallButtonStyle: React.CSSProperties = {
  minHeight: '28px',
  padding: '3px 8px',
  border: '1px solid var(--theme-elevation-250)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-elevation-100)',
  color: 'var(--theme-elevation-800)',
  cursor: 'pointer',
  fontSize: '11px',
}

const removeButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  color: 'var(--theme-error-600)',
  borderColor: 'var(--theme-error-300)',
}

const GUARD_KIND_LABELS: Record<GuardDraft['kind'], string> = {
  always: 'Siempre',
  answered: 'Pregunta respondida',
  selected: 'Opción elegida',
  cmp: 'Comparación numérica',
  not: 'NO se cumple…',
  all: 'Todas se cumplen (Y)',
  any: 'Alguna se cumple (O)',
}

const NUMERIC_KIND_LABELS = {
  num: 'Número',
  answer: 'Respuesta de pregunta',
  score: 'Puntuación de pregunta',
  sum: 'Suma',
} as const

type BuilderContext = {
  plugins: ReactQuestionPluginRegistry
  questions: readonly QuestionDraft[]
}

const NumericExprEditor = ({
  expr,
  onChange,
  onRemove,
  context,
}: {
  expr: NumericExprDraft
  onChange: (expr: NumericExprDraft) => void
  onRemove?: () => void
  context: BuilderContext
}) => {
  const { plugins, questions } = context
  const answerQuestions = questions.filter((question) =>
    compareCapability(plugins, question, 'answer'),
  )
  const scoreQuestions = questions.filter((question) =>
    compareCapability(plugins, question, 'score'),
  )

  const changeKind = (kind: NumericExprDraft['kind']) => {
    if (kind === expr.kind) return
    if (kind === 'num') onChange({ kind, value: 0 })
    else if (kind === 'answer' && answerQuestions[0]) onChange({ kind, q: answerQuestions[0].id })
    else if (kind === 'score' && scoreQuestions[0]) onChange({ kind, q: scoreQuestions[0].id })
    else if (kind === 'sum') {
      const operand = defaultNumericOperand(plugins, questions) ?? { kind: 'num' as const, value: 0 }
      onChange({ kind, values: [expr.kind === 'sum' ? operand : expr, operand] })
    }
  }

  return (
    <div style={{ display: 'grid', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <select
          aria-label="Tipo de valor"
          style={{ ...fieldStyle, flex: 1 }}
          value={expr.kind}
          onChange={(event) => changeKind(event.target.value as NumericExprDraft['kind'])}
        >
          <option value="num">{NUMERIC_KIND_LABELS.num}</option>
          <option value="answer" disabled={answerQuestions.length === 0}>
            {NUMERIC_KIND_LABELS.answer}
          </option>
          <option value="score" disabled={scoreQuestions.length === 0}>
            {NUMERIC_KIND_LABELS.score}
          </option>
          <option value="sum">{NUMERIC_KIND_LABELS.sum}</option>
        </select>
        {onRemove && (
          <button type="button" style={removeButtonStyle} onClick={onRemove} aria-label="Quitar valor">
            ×
          </button>
        )}
      </div>

      {expr.kind === 'num' && (
        <input
          aria-label="Valor numérico"
          type="number"
          style={fieldStyle}
          value={expr.value}
          onChange={(event) => {
            const value = Number(event.target.value)
            if (Number.isSafeInteger(value)) onChange({ ...expr, value })
          }}
        />
      )}

      {(expr.kind === 'answer' || expr.kind === 'score') && (
        <select
          aria-label="Pregunta del valor"
          style={fieldStyle}
          value={expr.q}
          onChange={(event) => onChange({ ...expr, q: event.target.value })}
        >
          {(expr.kind === 'answer' ? answerQuestions : scoreQuestions).map((question) => (
            <option key={question.id} value={question.id}>
              {questionLabel(question)}
            </option>
          ))}
        </select>
      )}

      {expr.kind === 'sum' && (
        <div
          style={{
            display: 'grid',
            gap: '5px',
            padding: '6px',
            border: '1px dashed var(--theme-elevation-200)',
            borderRadius: '6px',
          }}
        >
          {expr.values.map((value, index) => (
            <NumericExprEditor
              key={index}
              expr={value}
              context={context}
              onChange={(updated) => {
                const values = [...expr.values]
                values[index] = updated
                onChange({ ...expr, values })
              }}
              onRemove={
                expr.values.length > 1
                  ? () => onChange({ ...expr, values: expr.values.filter((_, i) => i !== index) })
                  : undefined
              }
            />
          ))}
          <button
            type="button"
            style={smallButtonStyle}
            onClick={() =>
              onChange({
                ...expr,
                values: [
                  ...expr.values,
                  defaultNumericOperand(context.plugins, context.questions) ?? {
                    kind: 'num',
                    value: 0,
                  },
                ],
              })
            }
          >
            + Sumando
          </button>
        </div>
      )}
    </div>
  )
}

export type GuardBuilderProps = {
  guard: GuardDraft
  onChange: (guard: GuardDraft) => void
  onRemove?: () => void
  plugins: ReactQuestionPluginRegistry
  /** Preguntas referenciables (propia página / anteriores + ancestros) */
  questions: readonly QuestionDraft[]
  /** false cuando otra flecha del nodo ya es la ruta por defecto */
  allowAlways?: boolean
  depth?: number
}

export const GuardBuilder = ({
  guard,
  onChange,
  onRemove,
  plugins,
  questions,
  allowAlways = true,
  depth = 0,
}: GuardBuilderProps) => {
  const context: BuilderContext = { plugins, questions }
  const available = availableGuardKinds(plugins, questions)
  const answerable = questions.filter((question) => supportsAnswered(plugins, question))
  const selectable = questions.filter(
    (question) => selectableOptions(plugins, question).length > 0,
  )

  const changeKind = (kind: GuardDraft['kind']) => {
    if (kind === guard.kind) return
    const next = defaultGuardForKind(kind, plugins, questions)
    if (next) onChange(next)
  }

  const kindOrder: GuardDraft['kind'][] = ['always', 'answered', 'selected', 'cmp', 'all', 'any', 'not']

  return (
    <div
      style={{
        display: 'grid',
        gap: '6px',
        padding: '7px',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '7px',
        background: depth % 2 === 0 ? 'var(--theme-elevation-50)' : 'var(--theme-elevation-0)',
      }}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        <select
          aria-label="Tipo de condición"
          style={{ ...fieldStyle, flex: 1 }}
          value={guard.kind}
          onChange={(event) => changeKind(event.target.value as GuardDraft['kind'])}
        >
          {kindOrder.map((kind) => (
            <option
              key={kind}
              value={kind}
              disabled={!available.has(kind) || (kind === 'always' && !allowAlways)}
            >
              {GUARD_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
        {onRemove && (
          <button
            type="button"
            style={removeButtonStyle}
            onClick={onRemove}
            aria-label="Quitar condición"
          >
            ×
          </button>
        )}
      </div>

      {guard.kind === 'always' && (
        <span style={{ fontSize: '11px', opacity: 0.7 }}>Ruta por defecto: se cumple siempre.</span>
      )}

      {guard.kind === 'answered' && (
        <select
          aria-label="Pregunta respondida"
          style={fieldStyle}
          value={guard.q}
          onChange={(event) => onChange({ ...guard, q: event.target.value })}
        >
          {answerable.map((question) => (
            <option key={question.id} value={question.id}>
              {questionLabel(question)}
            </option>
          ))}
        </select>
      )}

      {guard.kind === 'selected' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          <select
            aria-label="Pregunta de la opción"
            style={fieldStyle}
            value={guard.q}
            onChange={(event) => {
              const question = selectable.find(({ id }) => id === event.target.value)
              const option = question ? selectableOptions(plugins, question)[0] : undefined
              if (question && option) {
                onChange({ ...guard, q: question.id, option: option.id })
              }
            }}
          >
            {selectable.map((question) => (
              <option key={question.id} value={question.id}>
                {questionLabel(question)}
              </option>
            ))}
          </select>
          <select
            aria-label="Opción elegida"
            style={fieldStyle}
            value={guard.option}
            onChange={(event) => onChange({ ...guard, option: event.target.value })}
          >
            {(() => {
              const question = selectable.find(({ id }) => id === guard.q)
              const options = question ? selectableOptions(plugins, question) : []
              return options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.text.fallback}
                </option>
              ))
            })()}
          </select>
        </div>
      )}

      {guard.kind === 'cmp' && (
        <div style={{ display: 'grid', gap: '5px' }}>
          <NumericExprEditor
            expr={guard.left}
            context={context}
            onChange={(left) => onChange({ ...guard, left })}
          />
          <select
            aria-label="Operador"
            style={{ ...fieldStyle, justifySelf: 'center', minWidth: '72px' }}
            value={guard.op}
            onChange={(event) => onChange({ ...guard, op: event.target.value as ComparisonOpDraft })}
          >
            {operatorsForComparison(plugins, questions, guard.left, guard.right).map((op) => (
              <option key={op} value={op}>
                {COMPARISON_SYMBOLS[op]}
              </option>
            ))}
          </select>
          <NumericExprEditor
            expr={guard.right}
            context={context}
            onChange={(right) => onChange({ ...guard, right })}
          />
        </div>
      )}

      {guard.kind === 'not' && (
        <GuardBuilder
          guard={guard.value}
          onChange={(value) => onChange({ ...guard, value })}
          plugins={plugins}
          questions={questions}
          allowAlways={false}
          depth={depth + 1}
        />
      )}

      {(guard.kind === 'all' || guard.kind === 'any') && (
        <div style={{ display: 'grid', gap: '5px' }}>
          {guard.values.map((value, index) => (
            <GuardBuilder
              key={index}
              guard={value}
              plugins={plugins}
              questions={questions}
              allowAlways={false}
              depth={depth + 1}
              onChange={(updated) => {
                const values = [...guard.values]
                values[index] = updated
                onChange({ ...guard, values })
              }}
              onRemove={() =>
                onChange({ ...guard, values: guard.values.filter((_, i) => i !== index) })
              }
            />
          ))}
          <button
            type="button"
            style={smallButtonStyle}
            onClick={() => {
              const inner = defaultGuardForKind('answered', plugins, questions)
              if (inner) onChange({ ...guard, values: [...guard.values, inner] })
            }}
          >
            + Condición
          </button>
        </div>
      )}
    </div>
  )
}
