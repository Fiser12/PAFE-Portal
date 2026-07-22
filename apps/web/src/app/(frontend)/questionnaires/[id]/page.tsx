import { QuestionnaireRunner } from '@/components/questionnaires/QuestionnaireRunner'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { isActiveUser } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { payload } = await getSessionUser()
  try {
    const questionnaire = await payload.findByID({
      collection: 'guided-questionnaires',
      id,
      overrideAccess: true,
    })
    return { title: `${questionnaire.title} | PAFE` }
  } catch {
    return { title: 'Cuestionario | PAFE' }
  }
}

export default async function QuestionnairePage({ params }: PageProps) {
  const { id } = await params
  const { payload, user } = await getSessionUser()

  if (!user) redirect(`/login?redirect=/questionnaires/${encodeURIComponent(id)}`)
  if (!isActiveUser(user)) notFound()

  let questionnaire
  try {
    questionnaire = await payload.findByID({
      collection: 'guided-questionnaires',
      id,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  const parsed = flowGraphRuntime.parseSchema(questionnaire.schema)
  if (!parsed.ok) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="text-xl font-semibold">El cuestionario no está disponible</h1>
          <p className="mt-2 text-muted-foreground">
            Su definición FlowGraph no es válida. Contacta con el equipo de PAFE.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <QuestionnaireRunner
        title={questionnaire.title}
        description={questionnaire.description}
        schema={parsed.value}
      />
    </div>
  )
}
