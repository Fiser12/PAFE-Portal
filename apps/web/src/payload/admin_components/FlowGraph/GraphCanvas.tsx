'use client'

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Connection,
  type Edge as ReactFlowEdge,
  type Node,
  type NodeChange,
  type NodeProps,
  type ReactFlowInstance,
  type XYPosition,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { ReactQuestionPluginRegistry } from 'flowgraph-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  EdgeDraft,
  GuardDraft,
  LayoutDraft,
  NodeDraft,
  PageDraft,
  QuestionDraft,
  SchemaDraft,
} from './draft-types'
import { GuardBuilder } from './GuardBuilder'
import { eligibleQuestions, guardLabel, selectableOptions } from './guards'
import { layoutPositions, orderedEdges } from './layout'
import { NodeEditorModal } from './NodeEditorModal'
import { buttonStyle, dangerButtonStyle, fieldStyle } from './styles'

type Diagnostic = { severity: 'error' | 'warning'; text: string }
type SelectedEdge = { source: string; target: string }

type CanvasNodeData = {
  nodeID: string
  node: NodeDraft
  entry: boolean
  canDelete: boolean
  update: (node: NodeDraft) => void
  remove: () => void
  makeEntry: () => void
  edit: () => void
}

type CanvasNode = Node<CanvasNodeData, 'flowNode'>

type FlowGraphCanvasProps = {
  questionPlugins: ReactQuestionPluginRegistry
  schema: SchemaDraft
  title: string
  description: string
  diagnostics: readonly Diagnostic[]
  layout?: LayoutDraft | null
  onChange: (schema: SchemaDraft) => void
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onLayoutChange?: (layout: LayoutDraft) => void
  renderPageContentEditor?: (nodeID: string) => React.ReactNode
}

const slug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const uniqueID = (prefix: string, used: readonly string[]): string => {
  const base = slug(prefix) || 'elemento'
  let candidate = base
  let suffix = 2
  while (used.includes(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}

const FlowNode = ({ data, selected }: NodeProps<CanvasNode>) => {
  const { node, nodeID } = data
  const label = node.kind === 'page' ? node.title?.fallback || nodeID : node.outcome || nodeID
  const detail =
    node.kind === 'page'
      ? `${node.questions.length} pregunta${node.questions.length === 1 ? '' : 's'}`
      : 'Fin del recorrido'

  return (
    <div
      style={{
        width: '240px',
        padding: '12px',
        border: `2px solid ${
          selected
            ? 'var(--theme-success-500)'
            : node.kind === 'terminal'
              ? 'var(--theme-warning-500)'
              : 'var(--theme-elevation-300)'
        }`,
        borderRadius: '11px',
        background: 'var(--theme-elevation-0)',
        color: 'var(--theme-elevation-800)',
        position: 'relative',
        boxShadow: '0 5px 18px color-mix(in srgb, var(--theme-elevation-900) 12%, transparent)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ width: 13, height: 13 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px' }}>
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '999px',
            background:
              node.kind === 'terminal'
                ? 'var(--theme-warning-100)'
                : 'var(--theme-elevation-100)',
            fontSize: '10px',
          }}
        >
          {node.kind === 'terminal' ? 'RESULTADO' : 'PÁGINA'}
        </span>
        <code style={{ flex: 1, fontSize: '10px', opacity: 0.65 }}>{nodeID}</code>
        <details
          className="nodrag nopan"
          style={{ position: 'relative' }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <summary
            aria-label={`Acciones de ${nodeID}`}
            style={{
              display: 'grid',
              width: '28px',
              height: '28px',
              placeItems: 'center',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: '6px',
              background: 'var(--theme-elevation-50)',
              cursor: 'pointer',
              listStyle: 'none',
              fontSize: '17px',
              lineHeight: 1,
            }}
          >
            ⋯
          </summary>
          <div
            style={{
              position: 'absolute',
              top: '34px',
              right: 0,
              zIndex: 20,
              display: 'grid',
              width: '170px',
              padding: '5px',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: '8px',
              background: 'var(--theme-elevation-0)',
              boxShadow:
                '0 8px 24px color-mix(in srgb, var(--theme-elevation-900) 18%, transparent)',
            }}
          >
            <button
              type="button"
              style={{ ...buttonStyle, border: 0, textAlign: 'left' }}
              onClick={data.edit}
            >
              Editar {node.kind === 'page' ? 'página' : 'resultado'}
            </button>
            {node.kind === 'page' && (
              <button
                type="button"
                style={{ ...buttonStyle, border: 0, textAlign: 'left' }}
                onClick={data.makeEntry}
                disabled={data.entry}
              >
                {data.entry ? 'Página inicial' : 'Marcar como inicio'}
              </button>
            )}
            <button
              type="button"
              style={{ ...dangerButtonStyle, border: 0, textAlign: 'left' }}
              onClick={data.remove}
              disabled={!data.canDelete}
            >
              Eliminar
            </button>
          </div>
        </details>
      </div>

      <strong style={{ display: 'block', fontSize: '14px' }}>{label}</strong>
      <span style={{ display: 'block', marginTop: '3px', fontSize: '11px', opacity: 0.65 }}>
        {detail}
      </span>

      {node.kind === 'page' && (
        <Handle type="source" position={Position.Right} style={{ width: 13, height: 13 }} />
      )}
    </div>
  )
}

const nodeTypes = { flowNode: FlowNode }

export function FlowGraphCanvas({
  questionPlugins,
  schema,
  title,
  description,
  diagnostics,
  layout,
  onChange,
  onTitleChange,
  onDescriptionChange,
  onLayoutChange,
  renderPageContentEditor,
}: FlowGraphCanvasProps) {
  const [positions, setPositions] = useState<Record<string, XYPosition>>(() => ({
    ...layoutPositions(schema),
    ...(layout ?? {}),
  }))
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<CanvasNode> | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null)
  const [editingNodeID, setEditingNodeID] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const nodeEntries = useMemo(() => Object.entries(schema.nodes), [schema.nodes])
  const nodeIDs = useMemo(() => nodeEntries.map(([nodeID]) => nodeID), [nodeEntries])
  const automaticPositions = useMemo(() => layoutPositions(schema), [schema])
  const questions = useMemo(
    () =>
      nodeEntries
        .filter((entry): entry is [string, PageDraft] => entry[1].kind === 'page')
        .flatMap(([, page]) => page.questions),
    [nodeEntries],
  )

  useEffect(() => {
    setPositions((current) => {
      const next: Record<string, XYPosition> = {}
      nodeEntries.forEach(([nodeID]) => {
        next[nodeID] = current[nodeID] ?? automaticPositions[nodeID] ?? { x: 60, y: 60 }
      })
      return next
    })
  }, [automaticPositions, nodeEntries])

  useEffect(() => {
    if (!selectedEdge) return
    const source = schema.nodes[selectedEdge.source]
    if (
      source?.kind !== 'page' ||
      !source.edges.some((edge) => edge.to === selectedEdge.target)
    ) {
      setSelectedEdge(null)
    }
  }, [schema.nodes, selectedEdge])

  const persistLayout = useCallback(
    (next: Record<string, XYPosition>) => {
      if (!onLayoutChange) return
      const pruned: LayoutDraft = {}
      for (const nodeID of Object.keys(schema.nodes)) {
        const position = next[nodeID]
        if (position) pruned[nodeID] = { x: position.x, y: position.y }
      }
      onLayoutChange(pruned)
    },
    [onLayoutChange, schema.nodes],
  )

  const updateNode = useCallback(
    (nodeID: string, node: NodeDraft) => {
      onChange({ ...schema, nodes: { ...schema.nodes, [nodeID]: node } })
    },
    [onChange, schema],
  )

  const removeNode = useCallback(
    (nodeID: string) => {
      const nodes = Object.fromEntries(
        Object.entries(schema.nodes)
          .filter(([id]) => id !== nodeID)
          .map(([id, node]) => [
            id,
            node.kind === 'page'
              ? { ...node, edges: node.edges.filter((edge) => edge.to !== nodeID) }
              : node,
          ]),
      )
      const firstPage = Object.entries(nodes).find(([, node]) => node.kind === 'page')?.[0] ?? ''
      onChange({
        ...schema,
        entry: schema.entry === nodeID ? firstPage : schema.entry,
        nodes,
      })
      setSelectedEdge(null)
    },
    [onChange, schema],
  )

  const addNode = (kind: NodeDraft['kind']) => {
    const nodeID = uniqueID(kind === 'page' ? 'pagina' : 'resultado', nodeIDs)
    const node: NodeDraft =
      kind === 'page'
        ? {
            kind,
            title: { key: `page.${nodeID}.title`, fallback: 'Nueva página' },
            questions: [],
            edges: [],
          }
        : { kind, outcome: nodeID }
    onChange({
      ...schema,
      entry: schema.entry || (kind === 'page' ? nodeID : schema.entry),
      nodes: { ...schema.nodes, [nodeID]: node },
    })
  }

  const createQuestionID = () =>
    uniqueID(
      'pregunta',
      questions.map(({ id }) => id),
    )

  const nodes = useMemo<CanvasNode[]>(
    () =>
      nodeEntries.map(([nodeID, node]) => ({
        id: nodeID,
        type: 'flowNode',
        position: positions[nodeID] ?? automaticPositions[nodeID] ?? { x: 60, y: 60 },
        data: {
          nodeID,
          node,
          entry: schema.entry === nodeID,
          canDelete: nodeEntries.length > 1,
          update: (updated) => updateNode(nodeID, updated),
          remove: () => removeNode(nodeID),
          makeEntry: () => onChange({ ...schema, entry: nodeID }),
          edit: () => setEditingNodeID(nodeID),
        },
      })),
    [automaticPositions, nodeEntries, onChange, positions, removeNode, schema, updateNode],
  )

  const edges = useMemo<ReactFlowEdge[]>(
    () =>
      nodeEntries.flatMap(([source, node]) =>
        node.kind === 'page'
          ? node.edges.map((edge, index) => {
              const selected =
                selectedEdge?.source === source && selectedEdge.target === edge.to
              return {
                id: `${source}:${index}:${edge.to}`,
                source,
                target: edge.to,
                type: 'smoothstep',
                label: guardLabel(edge.when, questions),
                markerEnd: { type: MarkerType.ArrowClosed },
                animated: selected,
                style: {
                  stroke: selected
                    ? 'var(--theme-success-500)'
                    : 'var(--theme-elevation-500)',
                  strokeWidth: selected ? 3 : 2,
                },
                labelStyle: {
                  fill: 'var(--theme-elevation-800)',
                  fontSize: 11,
                  fontWeight: 600,
                },
                labelBgStyle: { fill: 'var(--theme-elevation-0)', fillOpacity: 0.94 },
                labelBgPadding: [6, 4] as [number, number],
                labelBgBorderRadius: 4,
              }
            })
          : [],
      ),
    [nodeEntries, questions, selectedEdge],
  )

  const onNodesChange = useCallback((changes: NodeChange<CanvasNode>[]) => {
    setPositions((current) => {
      let next = current
      for (const change of changes) {
        if (change.type !== 'position' || !change.position) continue
        if (next === current) next = { ...current }
        next[change.id] = change.position
      }
      return next
    })
  }, [])

  const updatePageEdges = useCallback(
    (sourceID: string, updater: (edges: readonly EdgeDraft[], page: PageDraft) => EdgeDraft[]) => {
      const source = schema.nodes[sourceID]
      if (source?.kind !== 'page') return
      updateNode(sourceID, { ...source, edges: orderedEdges(updater(source.edges, source)) })
    },
    [schema.nodes, updateNode],
  )

  const onConnect = useCallback(
    ({ source: sourceID, target }: Connection) => {
      if (!sourceID || !target || sourceID === target) return
      const source = schema.nodes[sourceID]
      if (source?.kind !== 'page') return
      if (source.edges.some((edge) => edge.to === target)) {
        setSelectedEdge({ source: sourceID, target })
        setNotice('La conexión ya existía; está seleccionada.')
        return
      }

      const hasDefault = source.edges.some((edge) => edge.when.kind === 'always')
      let when: GuardDraft = { kind: 'always' }
      if (hasDefault) {
        const eligible = eligibleQuestions(schema, sourceID)
        const localSelect = eligible.find(
          (question) => selectableOptions(questionPlugins, question).length > 0,
        )
        const candidate = localSelect ?? eligible[0]
        if (!candidate) {
          setNotice('Añade una pregunta en el nodo para poder distinguir una segunda ruta.')
          return
        }
        const option = selectableOptions(questionPlugins, candidate)[0]
        when = option
          ? { kind: 'selected', q: candidate.id, option: option.id }
          : { kind: 'answered', q: candidate.id }
      }

      updatePageEdges(sourceID, (current) => [...current, { to: target, when }])
      setSelectedEdge({ source: sourceID, target })
      setNotice('Flecha creada. Configura aquí su condición.')
    },
    [questionPlugins, schema, updatePageEdges],
  )

  const selectedPage = selectedEdge ? schema.nodes[selectedEdge.source] : undefined
  const selectedEdgeValue =
    selectedPage?.kind === 'page'
      ? selectedPage.edges.find((edge) => edge.to === selectedEdge?.target)
      : undefined

  const updateSelectedEdge = (updater: (edge: EdgeDraft) => EdgeDraft) => {
    if (!selectedEdge || !selectedEdgeValue) return
    const previousTarget = selectedEdge.target
    let updatedTarget = previousTarget
    updatePageEdges(selectedEdge.source, (current) =>
      current.map((edge) => {
        if (edge.to !== previousTarget) return edge
        const updated = updater(edge)
        updatedTarget = updated.to
        return updated
      }),
    )
    setSelectedEdge({ source: selectedEdge.source, target: updatedTarget })
    setNotice(null)
  }

  const deleteSelectedEdge = () => {
    if (!selectedEdge) return
    updatePageEdges(selectedEdge.source, (current) =>
      current.filter((edge) => edge.to !== selectedEdge.target),
    )
    setSelectedEdge(null)
    setNotice(null)
  }

  const anotherDefault =
    selectedPage?.kind === 'page' &&
    selectedPage.edges.some(
      (edge) => edge.to !== selectedEdge?.target && edge.when.kind === 'always',
    )
  const edgeEligibleQuestions = useMemo(
    () => (selectedEdge ? eligibleQuestions(schema, selectedEdge.source) : []),
    [schema, selectedEdge],
  )
  const editingNode = editingNodeID ? schema.nodes[editingNodeID] : undefined
  const arrangeGraph = () => {
    setPositions(automaticPositions)
    persistLayout(automaticPositions)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => flowInstance?.fitView({ padding: 0.2, duration: 250 }))
    })
  }

  return (
    <section
      style={{
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: 'var(--style-radius-m)',
        overflow: 'hidden',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div
        className="nodrag nopan"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(240px, 2fr) 120px 85px auto',
          gap: '8px',
          alignItems: 'end',
          padding: '12px',
          borderBottom: '1px solid var(--theme-elevation-200)',
        }}
      >
        <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
          Cuestionario
          <input style={fieldStyle} value={title} onChange={(event) => onTitleChange(event.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
          Descripción
          <input
            style={fieldStyle}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </label>
        <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
          ID del flujo
          <input
            style={fieldStyle}
            value={schema.id}
            onChange={(event) => onChange({ ...schema, id: event.target.value })}
          />
        </label>
        <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
          Versión
          <input
            style={fieldStyle}
            value={schema.version}
            onChange={(event) => onChange({ ...schema, version: event.target.value })}
          />
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" style={buttonStyle} onClick={() => addNode('page')}>
            + Página
          </button>
          <button type="button" style={buttonStyle} onClick={() => addNode('terminal')}>
            + Resultado
          </button>
          <button type="button" style={buttonStyle} onClick={arrangeGraph}>
            Ordenar grafo
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', height: '720px', background: 'var(--theme-elevation-0)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            setFlowInstance(instance)
          }}
          onNodesChange={onNodesChange}
          onNodeDragStop={() => persistLayout(positions)}
          onConnect={onConnect}
          onEdgeClick={(_, edge) => {
            setSelectedEdge({ source: edge.source, target: edge.target })
            setNotice(null)
          }}
          onPaneClick={() => {
            setSelectedEdge(null)
            setNotice(null)
          }}
          isValidConnection={(connection) =>
            Boolean(
              connection.source &&
                connection.target &&
                connection.source !== connection.target &&
                schema.nodes[connection.source]?.kind === 'page',
            )
          }
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.6}
        >
          <Background gap={20} size={1} color="var(--theme-elevation-150)" />
          <Controls />
        </ReactFlow>

        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 5,
            maxWidth: '310px',
            padding: '8px 10px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '8px',
            background: 'color-mix(in srgb, var(--theme-elevation-0) 94%, transparent)',
            fontSize: '11px',
          }}
        >
          {diagnostics.length === 0 ? (
            <span style={{ color: 'var(--theme-success-600)' }}>✓ Flujo válido y navegable</span>
          ) : (
            <details>
              <summary style={{ cursor: 'pointer', color: 'var(--theme-error-600)' }}>
                {diagnostics.length} aviso{diagnostics.length === 1 ? '' : 's'} del flujo
              </summary>
              <ul style={{ margin: '7px 0 0', paddingLeft: '16px' }}>
                {diagnostics.map((diagnostic, index) => (
                  <li key={`${diagnostic.text}-${index}`}>{diagnostic.text}</li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {(notice || selectedEdgeValue) && (
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '14px',
              zIndex: 6,
              width: 'min(820px, calc(100% - 150px))',
              maxHeight: '55%',
              overflow: 'auto',
              transform: 'translateX(-50%)',
              padding: '12px',
              border: '1px solid var(--theme-elevation-250)',
              borderRadius: '10px',
              background: 'var(--theme-elevation-0)',
              boxShadow: '0 8px 28px color-mix(in srgb, var(--theme-elevation-900) 18%, transparent)',
            }}
          >
            {notice && <p style={{ margin: selectedEdgeValue ? '0 0 8px' : 0 }}>{notice}</p>}
            {selectedEdge && selectedEdgeValue && (
              <div style={{ display: 'grid', gap: '8px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    alignItems: 'end',
                    gap: '7px',
                  }}
                >
                  <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                    Desde
                    <input style={fieldStyle} value={selectedEdge.source} disabled />
                  </label>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '11px' }}>
                    Destino
                    <select
                      style={fieldStyle}
                      value={selectedEdgeValue.to}
                      onChange={(event) => {
                        const destination = event.target.value
                        if (
                          selectedPage?.kind === 'page' &&
                          selectedPage.edges.some(
                            (edge) => edge.to === destination && edge.to !== selectedEdge.target,
                          )
                        ) {
                          setNotice('Ya existe otra flecha hacia ese destino.')
                          return
                        }
                        updateSelectedEdge((edge) => ({ ...edge, to: destination }))
                      }}
                    >
                      {nodeEntries
                        .filter(([nodeID]) => nodeID !== selectedEdge.source)
                        .map(([nodeID, node]) => (
                          <option key={nodeID} value={nodeID}>
                            {node.kind === 'page' ? node.title?.fallback || nodeID : node.outcome}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button type="button" style={dangerButtonStyle} onClick={deleteSelectedEdge}>
                    Eliminar flecha
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '11px' }}>Se sigue esta flecha cuando…</span>
                  <GuardBuilder
                    guard={selectedEdgeValue.when}
                    onChange={(when) => updateSelectedEdge((edge) => ({ ...edge, when }))}
                    plugins={questionPlugins}
                    questions={edgeEligibleQuestions}
                    allowAlways={!anotherDefault}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editingNodeID && editingNode && (
        <NodeEditorModal
          questionPlugins={questionPlugins}
          schema={schema}
          nodeID={editingNodeID}
          node={editingNode}
          entry={schema.entry === editingNodeID}
          canDelete={nodeEntries.length > 1}
          update={(node) => updateNode(editingNodeID, node)}
          makeEntry={() => onChange({ ...schema, entry: editingNodeID })}
          remove={() => removeNode(editingNodeID)}
          close={() => setEditingNodeID(null)}
          createQuestionID={createQuestionID}
          pageContentEditor={renderPageContentEditor?.(editingNodeID)}
        />
      )}
    </section>
  )
}
