'use client'

import { Button } from '@/components/ui/button'
import { submitQuestionnaireExecution } from '@/actions/submitQuestionnaireExecution'
import { flowGraphReactQuestionPlugins } from '@/lib/flowgraph/react'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { FlowPage, createBrowserEventStore, persistSession, useFlowSurvey } from 'flowgraph-react'
import { hashSchema, toSafeInt, type CommandMeta, type FlowSchema } from 'flowgraph-core'
import { createSession, type FlowSession, type SessionOptions } from 'flowgraph-session'
import {
  currentFlowGraphLexicalPageContent,
  type FlowGraphLexicalPageContent,
} from 'flowgraph-payload-lexical'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { Loader2 } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { QuestionnaireRichText } from './QuestionnaireRichText'

type PageContent = FlowGraphLexicalPageContent & {
  pageID: string
  content?: DefaultTypedEditorState | null
}

type QuestionnaireRunnerProps = {
  questionnaireId: number | string
  userId: number | string
  taskId?: number
  title: string
  description?: string | null
  schema: FlowSchema
  pageContents?: PageContent[] | null
}

type SubmitState =
  | { phase: 'idle' | 'sending' | 'done' }
  | { phase: 'error'; message: string }

const createMeta = (): CommandMeta => ({
  at: toSafeInt(Date.now()),
  source: 'human',
  path: [],
})

// El commit ya se ha aplicado cuando fallan los listeners (p.ej. localStorage
// lleno): registrar y seguir, nunca romper el flujo de respuesta del usuario.
const sessionOptions: SessionOptions = {
  onListenerError: (failures) => {
    console.error('FlowGraph session listener failed after commit:', failures)
  },
}

const createFlowSession = (schema: FlowSchema): FlowSession => {
  const result = createSession(flowGraphRuntime, schema, undefined, sessionOptions)
  if (!result.ok) throw new Error(`No se pudo crear la sesión: ${result.error.code}`)
  return result.value
}

export function QuestionnaireRunner({
  questionnaireId,
  userId,
  taskId,
  title,
  description,
  schema,
  pageContents,
}: QuestionnaireRunnerProps) {
  const storageKey = useMemo(
    () => `pafe:flowgraph:${userId}:${questionnaireId}:${hashSchema(schema)}`,
    [questionnaireId, schema, userId],
  )
  // SSR y primer render de cliente comparten una sesión limpia; la sesión
  // guardada se restaura tras montar para no divergir en la hidratación.
  const [session, setSession] = useState<FlowSession>(() => createFlowSession(schema))
  const [resumed, setResumed] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>({ phase: 'idle' })
  const submittedRef = useRef(false)

  const store = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : createBrowserEventStore({ storage: window.localStorage, key: storageKey }),
    [storageKey],
  )

  useEffect(() => {
    if (!store) return
    const stored = store.load()
    if (!stored.ok || !stored.value || stored.value.length === 0) {
      if (!stored.ok) store.clear()
      return
    }
    const restored = createSession(flowGraphRuntime, schema, stored.value, sessionOptions)
    if (restored.ok) {
      setSession(restored.value)
      setResumed(true)
    } else {
      store.clear()
    }
  }, [schema, store])

  useEffect(() => {
    if (!store) return
    return persistSession(session, store, (problem) => {
      console.error('FlowGraph persistence problem:', problem)
    })
  }, [session, store])

  const controller = useFlowSurvey({ runtime: flowGraphRuntime, schema, session, createMeta })

  const submit = useCallback(async () => {
    setSubmitState({ phase: 'sending' })
    const result = await submitQuestionnaireExecution({
      questionnaireId,
      events: session.getEvents() as unknown,
      taskId,
    })
    if (result.ok) {
      setSubmitState({ phase: 'done' })
      store?.clear()
    } else {
      setSubmitState({ phase: 'error', message: result.error })
    }
  }, [questionnaireId, session, store, taskId])

  const finished = controller.state.status === 'finished'
  useEffect(() => {
    if (!finished || submittedRef.current) return
    submittedRef.current = true
    void submit()
  }, [finished, submit])

  const start = useCallback(() => {
    session.dispatch({
      kind: 'START',
      schemaHash: hashSchema(schema),
      meta: createMeta(),
    })
  }, [schema, session])

  const currentContent = currentFlowGraphLexicalPageContent(
    controller.state,
    pageContents,
  )?.content

  if (controller.state.status === 'not-started') {
    return (
      <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="mb-2 text-sm font-medium text-primary">Cuestionario guiado</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-3 text-muted-foreground">{description}</p>}
        <Button className="mt-6" onClick={start}>
          Comenzar
        </Button>
      </section>
    )
  }

  if (controller.state.status === 'finished') {
    return (
      <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-medium text-primary">Cuestionario completado</p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          Resultado: <strong>{controller.state.outcome}</strong>
        </p>
        {(submitState.phase === 'idle' || submitState.phase === 'sending') && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando tu respuesta…
          </p>
        )}
        {submitState.phase === 'done' && (
          <p className="mt-4 text-sm font-medium text-primary">
            Tu respuesta se ha guardado correctamente.
          </p>
        )}
        {submitState.phase === 'error' && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-destructive">{submitState.message}</p>
            <Button variant="outline" onClick={() => void submit()}>
              Reintentar envío
            </Button>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="flowgraph-pafe mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-sm font-medium text-primary">{title}</p>
      {resumed && (
        <p className="mb-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Hemos recuperado tu sesión anterior; puedes continuar donde lo dejaste.
        </p>
      )}
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
