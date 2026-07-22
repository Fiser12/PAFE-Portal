'use client'

import { Button } from '@/components/ui/button'
import { flowGraphReactQuestionPlugins } from '@/lib/flowgraph/react'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { FlowPage, useFlowSurvey } from 'flowgraph-react'
import { hashSchema, toSafeInt, type CommandMeta, type FlowSchema } from 'flowgraph-core'
import { createSession, type FlowSession } from 'flowgraph-session'
import React, { useCallback, useMemo } from 'react'

type QuestionnaireRunnerProps = {
  title: string
  description?: string | null
  schema: FlowSchema
}

const createMeta = (): CommandMeta => ({
  at: toSafeInt(Date.now()),
  source: 'human',
  path: [],
})

const createFlowSession = (schema: FlowSchema): FlowSession => {
  const result = createSession(flowGraphRuntime, schema)
  if (!result.ok) throw new Error(`No se pudo crear la sesión: ${result.error.code}`)
  return result.value
}

export function QuestionnaireRunner({ title, description, schema }: QuestionnaireRunnerProps) {
  const session = useMemo(() => createFlowSession(schema), [schema])
  const controller = useFlowSurvey({ runtime: flowGraphRuntime, schema, session, createMeta })

  const start = useCallback(() => {
    session.dispatch({
      kind: 'START',
      schemaHash: hashSchema(schema),
      meta: createMeta(),
    })
  }, [schema, session])

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
        <p className="text-sm font-medium text-primary">Respuesta enviada</p>
        <h1 className="mt-2 text-2xl font-semibold">Cuestionario completado</h1>
        <p className="mt-3 text-muted-foreground">
          Resultado: <strong>{controller.state.outcome}</strong>
        </p>
      </section>
    )
  }

  return (
    <div className="flowgraph-pafe mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-sm font-medium text-primary">{title}</p>
      <FlowPage
        controller={controller}
        questionPlugins={flowGraphReactQuestionPlugins}
        nextLabel="Continuar"
        backLabel="Atrás"
      />
    </div>
  )
}
