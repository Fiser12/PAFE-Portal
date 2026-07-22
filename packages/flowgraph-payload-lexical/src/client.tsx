'use client'

import { RenderFields, useConfig, useField, useForm } from '@payloadcms/ui'
import type { ArrayFieldClient, ClientField, CollectionSlug, FormState } from 'payload'
import { useEffect, useMemo, useRef } from 'react'

import {
  DEFAULT_CONTENT_FIELD,
  DEFAULT_PAGE_CONTENTS_FIELD,
  DEFAULT_PAGE_ID_FIELD,
} from './constants'
import { createEmptyLexicalEditorState, hasEmptyLexicalRoot } from './lexical-state'

export type FlowGraphLexicalPageEditorLabels = {
  title?: string
  preparing?: string
  configurationError?: string
}

export type FlowGraphLexicalPageEditorProps = {
  collectionSlug: string
  nodeID: string
  fieldName?: string
  pageIDFieldName?: string
  contentFieldName?: string
  labels?: FlowGraphLexicalPageEditorLabels
}

const initialField = (value: unknown) => ({
  initialValue: value,
  passesCondition: true,
  valid: true,
  value,
})

function LexicalEditorForRow({
  contentField,
  contentFieldName,
  fieldName,
  preparingLabel,
  rowIndex,
}: {
  contentField: ClientField
  contentFieldName: string
  fieldName: string
  preparingLabel: string
  rowIndex: number
}) {
  const path = `${fieldName}.${rowIndex}.${contentFieldName}`
  const field = useField<unknown>({ path })
  const needsRepair = hasEmptyLexicalRoot(field.value)

  useEffect(() => {
    if (needsRepair) field.setValue(createEmptyLexicalEditorState())
  }, [field, needsRepair])

  if (needsRepair) return <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>{preparingLabel}</p>

  return (
    <RenderFields
      fields={[contentField]}
      forceRender
      margins="small"
      parentIndexPath=""
      parentPath={`${fieldName}.${rowIndex}`}
      parentSchemaPath={fieldName}
      permissions={true}
    />
  )
}

export function FlowGraphLexicalPageEditor({
  collectionSlug,
  nodeID,
  fieldName = DEFAULT_PAGE_CONTENTS_FIELD,
  pageIDFieldName = DEFAULT_PAGE_ID_FIELD,
  contentFieldName = DEFAULT_CONTENT_FIELD,
  labels,
}: FlowGraphLexicalPageEditorProps) {
  const titleLabel = labels?.title ?? 'Page content'
  const preparingLabel = labels?.preparing ?? 'Preparing content…'
  const configurationErrorLabel =
    labels?.configurationError ?? 'The Payload Lexical field configuration is unavailable.'
  const { getEntityConfig } = useConfig()
  const { addFieldRow, getDataByPath } = useForm()
  const pageContentsState = useField({ path: fieldName, hasRows: true })
  const creatingNode = useRef<string | null>(null)

  const arrayField = useMemo(() => {
    const collection = getEntityConfig({ collectionSlug: collectionSlug as CollectionSlug })
    const field = collection?.fields.find(
      (candidate) => 'name' in candidate && candidate.name === fieldName,
    )
    return field?.type === 'array' ? (field as ArrayFieldClient) : null
  }, [collectionSlug, fieldName, getEntityConfig])

  const values = getDataByPath<Record<string, unknown>[]>(fieldName) ?? []
  const rowIndex = values.findIndex((value) => value?.[pageIDFieldName] === nodeID)

  useEffect(() => {
    if (!arrayField || rowIndex >= 0 || creatingNode.current === nodeID) return
    creatingNode.current = nodeID
    const subFieldState: FormState = {
      [pageIDFieldName]: initialField(nodeID),
      [contentFieldName]: initialField(createEmptyLexicalEditorState()),
    }
    addFieldRow({
      path: fieldName,
      schemaPath: fieldName,
      subFieldState,
    })
  }, [
    addFieldRow,
    arrayField,
    contentFieldName,
    fieldName,
    nodeID,
    pageIDFieldName,
    rowIndex,
  ])

  useEffect(() => {
    if (rowIndex >= 0) creatingNode.current = null
  }, [rowIndex])

  const contentField = arrayField?.fields.find(
    (candidate) => 'name' in candidate && candidate.name === contentFieldName,
  )

  if (!arrayField || !contentField) {
    return (
      <p style={{ margin: 0, color: 'var(--theme-error-600)', fontSize: '12px' }}>
        {configurationErrorLabel}
      </p>
    )
  }
  if (rowIndex < 0 || pageContentsState.rows?.[rowIndex]?.isLoading) {
    return <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>{preparingLabel}</p>
  }

  return (
    <div style={{ display: 'grid', gap: '7px' }}>
      <strong>{titleLabel}</strong>
      <LexicalEditorForRow
        contentField={contentField}
        contentFieldName={contentFieldName}
        fieldName={fieldName}
        preparingLabel={preparingLabel}
        rowIndex={rowIndex}
      />
    </div>
  )
}
