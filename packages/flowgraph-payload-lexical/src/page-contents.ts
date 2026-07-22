import type { FlowSchema, FlowState } from 'flowgraph-core'

import { DEFAULT_PAGE_ID_FIELD } from './constants'

export type FlowGraphLexicalPageContent = Record<string, unknown> & {
  pageID: string
}

type PageContentOptions = {
  pageIDFieldName?: string
}

export const reconcileFlowGraphLexicalPageContents = (
  schema: FlowSchema,
  value: unknown,
  options: PageContentOptions = {},
): FlowGraphLexicalPageContent[] => {
  if (!Array.isArray(value)) return []

  const pageIDFieldName = options.pageIDFieldName ?? DEFAULT_PAGE_ID_FIELD
  const validPageIDs = new Set(
    Object.entries(schema.nodes)
      .filter(([, node]) => node.kind === 'page')
      .map(([nodeID]) => nodeID),
  )
  const seen = new Set<string>()
  const result: FlowGraphLexicalPageContent[] = []

  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue
    const pageID = (candidate as Record<string, unknown>)[pageIDFieldName]
    if (typeof pageID !== 'string' || !validPageIDs.has(pageID) || seen.has(pageID)) continue
    seen.add(pageID)
    result.push(candidate as FlowGraphLexicalPageContent)
  }

  return result
}

export const currentFlowGraphLexicalPageContent = <
  T extends FlowGraphLexicalPageContent,
>(
  state: FlowState,
  pageContents: readonly T[] | null | undefined,
): T | undefined => {
  const currentNodeID = state.trail.at(-1)
  return currentNodeID === undefined
    ? undefined
    : pageContents?.find(({ pageID }) => pageID === currentNodeID)
}
