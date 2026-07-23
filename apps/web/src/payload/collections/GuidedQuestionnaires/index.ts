import { COLLECTION_SLUG_GUIDED_QUESTIONNAIRES } from '@/core/collections-slugs'
import { hiddenUnlessAdmin, isActiveUserAccess, isStaffAccess } from '@/core/permissions'
import { createDefaultFlowSchema } from '@/lib/flowgraph/defaultSchema'
import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { questionnaireLexical } from '@/payload/fields/questionnaireLexical'
import { hashSchema } from 'flowgraph-core'
import {
  createFlowGraphLexicalPageContentsField,
  reconcileFlowGraphLexicalPageContents,
} from 'flowgraph-payload-lexical'
import type { CollectionBeforeChangeHook, CollectionConfig, JSONField } from 'payload'

const validateSchema: NonNullable<JSONField['validate']> = (value) => {
  const parsed = flowGraphRuntime.parseSchema(value)
  if (!parsed.ok) {
    const first = parsed.error[0]
    const location = first?.path.length ? ` en ${first.path.join('.')}` : ''
    return `El JSON de FlowGraph no es válido${location}.`
  }

  const errors = flowGraphRuntime.check(parsed.value).filter((problem) => problem.severity === 'error')
  if (errors.length > 0) {
    return `FlowGraph: ${errors.map((problem) => problem.code).join(', ')}`
  }

  return true
}

const populateSchemaMetadata: CollectionBeforeChangeHook = ({ data }) => {
  const parsed = flowGraphRuntime.parseSchema(data.schema)
  if (!parsed.ok) return data

  // El layout del editor es cosmético y vive fuera del schema (no altera su
  // hash); aquí solo se descartan posiciones de nodos que ya no existen.
  const layout =
    data.editorLayout && typeof data.editorLayout === 'object'
      ? Object.fromEntries(
          Object.entries(data.editorLayout as Record<string, unknown>).filter(
            ([nodeID]) => parsed.value.nodes[nodeID as keyof typeof parsed.value.nodes],
          ),
        )
      : data.editorLayout

  return {
    ...data,
    editorLayout: layout,
    pageContents: reconcileFlowGraphLexicalPageContents(parsed.value, data.pageContents),
    schema: flowGraphRuntime.withQuestionPluginManifest(parsed.value),
    schemaHash: hashSchema(flowGraphRuntime.withQuestionPluginManifest(parsed.value)),
    schemaID: parsed.value.id,
    schemaVersion: parsed.value.version,
  }
}

export const GuidedQuestionnaires: CollectionConfig = {
  slug: COLLECTION_SLUG_GUIDED_QUESTIONNAIRES,
  labels: {
    singular: 'Cuestionario guiado',
    plural: 'Cuestionarios guiados',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    read: isActiveUserAccess,
    update: isStaffAccess,
  },
  admin: {
    hidden: hiddenUnlessAdmin,
    defaultColumns: ['title', 'schemaVersion', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Título',
      type: 'text',
      required: true,
      admin: { hidden: true },
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      admin: { hidden: true },
    },
    {
      name: 'schema',
      label: 'Flujo del cuestionario',
      type: 'json',
      required: true,
      defaultValue: createDefaultFlowSchema,
      validate: validateSchema,
      admin: {
        components: {
          Field: '@/payload/admin_components/FlowGraph/Component#FlowGraphField',
        },
      },
    },
    {
      name: 'schemaID',
      label: 'ID del esquema',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'editorLayout',
      label: 'Disposición del grafo',
      type: 'json',
      admin: { hidden: true },
    },
    createFlowGraphLexicalPageContentsField({
      editor: questionnaireLexical,
      label: 'Contenido de las páginas',
    }),
    {
      name: 'schemaVersion',
      label: 'Versión del esquema',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'schemaHash',
      label: 'Hash del esquema',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [populateSchemaMetadata],
  },
  timestamps: true,
}
