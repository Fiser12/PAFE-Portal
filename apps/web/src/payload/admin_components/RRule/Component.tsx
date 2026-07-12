'use client'

import React, { useMemo } from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { RRule, Weekday, type Options } from 'rrule'
import { rruleToText } from '@/utils/rrule-helpers'
import type { RRuleValue } from '@/types/rrule'

const FREQ_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Sin repetición' },
  { value: String(RRule.DAILY), label: 'Diaria' },
  { value: String(RRule.WEEKLY), label: 'Semanal' },
  { value: String(RRule.MONTHLY), label: 'Mensual' },
  { value: String(RRule.YEARLY), label: 'Anual' },
]

const INTERVAL_UNIT: Record<number, string> = {
  [RRule.DAILY]: 'día(s)',
  [RRule.WEEKLY]: 'semana(s)',
  [RRule.MONTHLY]: 'mes(es)',
  [RRule.YEARLY]: 'año(s)',
}

const WEEKDAYS: { day: Weekday; label: string }[] = [
  { day: RRule.MO, label: 'L' },
  { day: RRule.TU, label: 'M' },
  { day: RRule.WE, label: 'X' },
  { day: RRule.TH, label: 'J' },
  { day: RRule.FR, label: 'V' },
  { day: RRule.SA, label: 'S' },
  { day: RRule.SU, label: 'D' },
]

type EndMode = 'never' | 'until' | 'count'

interface EditorState {
  freq: number | null
  interval: number
  byweekday: number[]
  dtstart: Date | null
  until: Date | null
  count: number | null
}

const toWeekdayNumbers = (byweekday: Options['byweekday'] | undefined): number[] => {
  if (byweekday == null) return []
  const arr = Array.isArray(byweekday) ? byweekday : [byweekday]
  return arr
    .map((w) => {
      if (typeof w === 'number') return w
      if (w instanceof Weekday) return w.weekday
      return null
    })
    .filter((w): w is number => w !== null)
}

const parseValue = (value: RRuleValue | null | undefined): EditorState => {
  const empty: EditorState = {
    freq: null,
    interval: 1,
    byweekday: [],
    dtstart: null,
    until: null,
    count: null,
  }
  if (!value?.rrule) return empty
  try {
    const opts = RRule.fromString(value.rrule).origOptions
    return {
      freq: typeof opts.freq === 'number' ? opts.freq : null,
      interval: opts.interval ?? 1,
      byweekday: toWeekdayNumbers(opts.byweekday),
      dtstart: opts.dtstart ?? null,
      until: opts.until ?? null,
      count: opts.count ?? null,
    }
  } catch {
    return empty
  }
}

const toDateInput = (date: Date | null): string => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const fromDateInput = (input: string): Date | null => {
  if (!input) return null
  const [y, m, d] = input.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  backgroundColor: 'var(--theme-input-bg)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s)',
  color: 'var(--theme-elevation-800)',
  fontSize: '14px',
  minHeight: '36px',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--theme-elevation-600)',
  minWidth: '90px',
}

export const RRuleField: JSONFieldClientComponent = ({ path, field }) => {
  const { required, label } = field
  const { value, setValue } = useField<RRuleValue | null>({ path })

  const state = useMemo(() => parseValue(value), [value])
  const endMode: EndMode = state.until ? 'until' : state.count ? 'count' : 'never'

  const previewText = useMemo(() => {
    if (!value?.rrule) return ''
    try {
      return rruleToText(value)
    } catch {
      return 'Formato RRule inválido'
    }
  }, [value])

  const apply = (changes: Partial<EditorState>) => {
    const next = { ...state, ...changes }
    if (next.freq == null) {
      setValue(null)
      return
    }
    const rule = new RRule({
      freq: next.freq,
      interval: next.interval > 0 ? next.interval : 1,
      byweekday:
        next.freq === RRule.WEEKLY && next.byweekday.length > 0
          ? next.byweekday.map((d) => new Weekday(d))
          : undefined,
      dtstart: next.dtstart ?? undefined,
      until: next.until ?? undefined,
      count: next.count ?? undefined,
    })
    setValue({
      rrule: rule.toString(),
      datePickerInitialDate: (next.dtstart ?? new Date()).toISOString(),
    })
  }

  const toggleWeekday = (weekday: number) => {
    const byweekday = state.byweekday.includes(weekday)
      ? state.byweekday.filter((d) => d !== weekday)
      : [...state.byweekday, weekday].sort()
    apply({ byweekday })
  }

  return (
    <div className="field-type json">
      <FieldLabel label={label || 'Regla de Recurrencia'} required={required} />

      {previewText && (
        <div
          style={{
            padding: '10px 12px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: 'var(--style-radius-s)',
            backgroundColor: 'var(--theme-elevation-50)',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '12px',
          }}
        >
          {previewText}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--theme-elevation-50)',
          padding: '16px',
          borderRadius: 'var(--style-radius-s)',
          border: '1px solid var(--theme-elevation-200)',
        }}
      >
        <div style={rowStyle}>
          <span style={labelStyle}>Repetir</span>
          <select
            style={inputStyle}
            value={state.freq == null ? '' : String(state.freq)}
            onChange={(e) =>
              apply({ freq: e.target.value === '' ? null : Number(e.target.value) })
            }
          >
            {FREQ_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {state.freq != null && (
          <>
            <div style={rowStyle}>
              <span style={labelStyle}>Cada</span>
              <input
                type="number"
                min={1}
                style={{ ...inputStyle, width: '80px' }}
                value={state.interval}
                onChange={(e) => apply({ interval: Number(e.target.value) || 1 })}
              />
              <span style={{ fontSize: '13px', color: 'var(--theme-elevation-600)' }}>
                {INTERVAL_UNIT[state.freq]}
              </span>
            </div>

            {state.freq === RRule.WEEKLY && (
              <div style={rowStyle}>
                <span style={labelStyle}>Días</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {WEEKDAYS.map(({ day, label: dayLabel }) => {
                    const active = state.byweekday.includes(day.weekday)
                    return (
                      <button
                        key={day.weekday}
                        type="button"
                        onClick={() => toggleWeekday(day.weekday)}
                        aria-pressed={active}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '1px solid var(--theme-elevation-200)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: active
                            ? 'var(--theme-elevation-800)'
                            : 'var(--theme-input-bg)',
                          color: active
                            ? 'var(--theme-elevation-0)'
                            : 'var(--theme-elevation-600)',
                        }}
                      >
                        {dayLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={rowStyle}>
              <span style={labelStyle}>Empieza</span>
              <input
                type="date"
                style={inputStyle}
                value={toDateInput(state.dtstart)}
                onChange={(e) => apply({ dtstart: fromDateInput(e.target.value) })}
              />
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Termina</span>
              <select
                style={inputStyle}
                value={endMode}
                onChange={(e) => {
                  const mode = e.target.value as EndMode
                  if (mode === 'never') apply({ until: null, count: null })
                  if (mode === 'until') apply({ until: state.until ?? new Date(), count: null })
                  if (mode === 'count') apply({ until: null, count: state.count ?? 10 })
                }}
              >
                <option value="never">Nunca</option>
                <option value="until">En fecha</option>
                <option value="count">Tras N veces</option>
              </select>
              {endMode === 'until' && (
                <input
                  type="date"
                  style={inputStyle}
                  value={toDateInput(state.until)}
                  onChange={(e) => apply({ until: fromDateInput(e.target.value) })}
                />
              )}
              {endMode === 'count' && (
                <input
                  type="number"
                  min={1}
                  style={{ ...inputStyle, width: '80px' }}
                  value={state.count ?? 10}
                  onChange={(e) => apply({ count: Number(e.target.value) || 1 })}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
