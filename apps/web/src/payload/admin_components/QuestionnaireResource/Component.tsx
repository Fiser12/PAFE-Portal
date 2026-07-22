'use client'

import {
  getCatalogSearchResult,
  searchCatalog,
} from '@/modules/catalog/actions/searchCatalog'
import type { CatalogResult } from '@/modules/catalog/ui/CatalogSearch/ResultCard'
import { useField } from '@payloadcms/ui'
import type { RelationshipFieldClientComponent } from 'payload'
import React, { useEffect, useMemo, useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '38px',
  padding: '7px 10px',
  border: '1px solid var(--theme-elevation-250)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-elevation-800)',
}

const buttonStyle: React.CSSProperties = {
  minHeight: '32px',
  padding: '5px 10px',
  border: '1px solid var(--theme-elevation-250)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-elevation-100)',
  color: 'var(--theme-elevation-800)',
  cursor: 'pointer',
}

const resourceID = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' || typeof id === 'string' ? id : null
  }
  return null
}

const typeLabel = (result: CatalogResult): string =>
  result.collectionType === 'catalog-item'
    ? 'Reservable'
    : result.collectionType === 'files'
      ? 'Descargable'
      : 'Recurso externo'

export const QuestionnaireResourceField: RelationshipFieldClientComponent = ({ path }) => {
  const field = useField<unknown>({ path })
  const selectedID = resourceID(field.value)
  const [selected, setSelected] = useState<CatalogResult | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedID === null) {
      setSelected(null)
      return
    }

    let cancelled = false
    void getCatalogSearchResult(selectedID).then((result) => {
      if (!cancelled) setSelected(result as CatalogResult | null)
    })
    return () => {
      cancelled = true
    }
  }, [selectedID])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timeout = window.setTimeout(() => {
      void searchCatalog({ query: term, limit: 8 }).then((response) => {
        if (cancelled) return
        setResults(response.docs as CatalogResult[])
        setLoading(false)
      })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [query])

  const selectedTitle = useMemo(
    () => selected?.title ?? (selectedID === null ? null : `Recurso ${selectedID}`),
    [selected, selectedID],
  )

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {selectedID !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px',
            border: '1px solid var(--theme-success-300)',
            borderRadius: '8px',
            background: 'var(--theme-success-50)',
          }}
        >
          <div>
            <strong style={{ display: 'block' }}>{selectedTitle}</strong>
            {selected && (
              <span style={{ fontSize: '12px', opacity: 0.7 }}>{typeLabel(selected)}</span>
            )}
          </div>
          <button type="button" style={buttonStyle} onClick={() => field.setValue(null)}>
            Cambiar
          </button>
        </div>
      )}

      {selectedID === null && (
        <>
          <input
            aria-label="Buscar recurso del catálogo"
            placeholder="Busca por título…"
            style={inputStyle}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {loading && <span style={{ fontSize: '12px', opacity: 0.7 }}>Buscando…</span>}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <span style={{ fontSize: '12px', opacity: 0.7 }}>No hay resultados.</span>
          )}
          {results.length > 0 && (
            <div style={{ display: 'grid', gap: '6px' }}>
              {results.map((result) => (
                <button
                  key={String(result.id)}
                  type="button"
                  onClick={() => {
                    setSelected(result)
                    field.setValue(result.id)
                  }}
                  style={{
                    ...buttonStyle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    textAlign: 'left',
                  }}
                >
                  <span>{result.title || `Recurso ${result.id}`}</span>
                  <span style={{ opacity: 0.65 }}>{typeLabel(result)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
