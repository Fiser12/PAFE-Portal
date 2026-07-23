import type { XYPosition } from '@xyflow/react'

import type { EdgeDraft, SchemaDraft } from './draft-types'

export const NODE_WIDTH = 240
export const NODE_HEIGHT = 92
export const NODE_GAP_X = 140
export const NODE_GAP_Y = 75

export const layoutPositions = (schema: SchemaDraft): Record<string, XYPosition> => {
  const nodeIDs = Object.keys(schema.nodes)
  if (nodeIDs.length === 0) return {}

  const entry = schema.nodes[schema.entry] ? schema.entry : nodeIDs[0]!
  const levels = new Map<string, number>([[entry, 0]])
  const queue = [entry]

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const nodeID = queue[cursor]!
    const node = schema.nodes[nodeID]
    if (node?.kind !== 'page') continue
    const nextLevel = (levels.get(nodeID) ?? 0) + 1
    for (const edge of node.edges) {
      if (!schema.nodes[edge.to] || levels.has(edge.to)) continue
      levels.set(edge.to, nextLevel)
      queue.push(edge.to)
    }
  }

  const lastReachableLevel = Math.max(0, ...levels.values())
  for (const nodeID of nodeIDs) {
    if (!levels.has(nodeID)) levels.set(nodeID, lastReachableLevel + 1)
  }

  const columns = new Map<number, string[]>()
  for (const nodeID of nodeIDs) {
    const level = levels.get(nodeID) ?? 0
    columns.set(level, [...(columns.get(level) ?? []), nodeID])
  }
  const maxRows = Math.max(...[...columns.values()].map((column) => column.length))
  const positions: Record<string, XYPosition> = {}

  for (const [level, column] of columns) {
    const verticalOffset = ((maxRows - column.length) * (NODE_HEIGHT + NODE_GAP_Y)) / 2
    column.forEach((nodeID, row) => {
      positions[nodeID] = {
        x: 60 + level * (NODE_WIDTH + NODE_GAP_X),
        y: 60 + verticalOffset + row * (NODE_HEIGHT + NODE_GAP_Y),
      }
    })
  }

  return positions
}

export const orderedEdges = (edges: readonly EdgeDraft[]): EdgeDraft[] => [
  ...edges.filter((edge) => edge.when.kind !== 'always'),
  ...edges.filter((edge) => edge.when.kind === 'always'),
]
