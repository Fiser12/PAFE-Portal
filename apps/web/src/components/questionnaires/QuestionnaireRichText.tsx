'use client'

import { getCatalogSearchResult } from '@/modules/catalog/actions/searchCatalog'
import {
  CatalogResultCard,
  type CatalogResult,
} from '@/modules/catalog/ui/CatalogSearch/ResultCard'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  type JSXConvertersFunction,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'
import React, { useEffect, useState } from 'react'

type QuestionnaireResourceBlock = {
  blockType: 'questionnaireResource'
  resource: number | string | CatalogResult
}

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<QuestionnaireResourceBlock>

function ResourceCard({ resource }: { resource: QuestionnaireResourceBlock['resource'] }) {
  const [result, setResult] = useState<CatalogResult | null>(
    typeof resource === 'object' ? resource : null,
  )

  useEffect(() => {
    if (typeof resource === 'object') {
      setResult(resource)
      return
    }

    let cancelled = false
    void getCatalogSearchResult(resource).then((value) => {
      if (!cancelled) setResult(value as CatalogResult | null)
    })
    return () => {
      cancelled = true
    }
  }, [resource])

  if (!result) {
    return <p className="rounded-lg border bg-muted p-4 text-sm">Cargando recurso…</p>
  }

  return (
    <div className="not-prose my-5 max-w-sm">
      <CatalogResultCard result={result} />
    </div>
  )
}

const converters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    questionnaireResource: ({ node }) => <ResourceCard resource={node.fields.resource} />,
  },
})

export function QuestionnaireRichText({ data }: { data: DefaultTypedEditorState }) {
  return (
    <ConvertRichText
      className="payload-richtext prose prose-sm mb-6 max-w-none dark:prose-invert"
      converters={converters}
      data={data}
    />
  )
}
