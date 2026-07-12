'use client'

import React, { useState } from 'react'
import { useField, FieldLabel, useTheme } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { rruleToText } from '@/utils/rrule-helpers'
import type { RRuleValue } from '@/types/rrule'
import { RRuleBuilder } from 'react-rrule-builder-ts';
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DateTime } from "luxon";

export const RRuleField: JSONFieldClientComponent = ({ path, field }) => {
  const { required, label } = field;
  const { value, setValue } = useField<RRuleValue>({ path })
  const [previewText, setPreviewText] = useState('')
  // El builder es MUI: sincroniza su paleta con el tema del admin de Payload
  const { theme } = useTheme()

  React.useEffect(() => {
    if (!value) {
      setPreviewText('')
      return
    }
    try {
      const rruleData = value as RRuleValue
      const spanishText = rruleToText(rruleData)
      setPreviewText(spanishText)
    } catch (error) {
      setPreviewText('Formato RRule inválido')
    }
  }, [value])

  const handleRRuleChange = (rrule: string, options?: any) => {
    const newRruleValue: RRuleValue = {
      rrule,
      ...options,
      datePickerInitialDate: options?.datePickerInitialDate?.toISOString?.() || new Date().toISOString(),
      frequency: options?.frequency,
    }
    setValue(newRruleValue)
  }

  return (
    <div className="field-type text">
      <FieldLabel
        label={label || 'Regla de Recurrencia'}
        required={required}
      />

      {/* Preview text */}
      {previewText && (
        <div
          style={{
            padding: '12px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: 'var(--theme-border-radius)',
            backgroundColor: 'var(--theme-elevation-50)',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '15px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {previewText}
        </div>
      )}

      <div style={{
        backgroundColor: 'var(--theme-elevation-50)',
        padding: '16px',
        borderRadius: 'var(--theme-border-radius)',
        border: '1px solid var(--theme-elevation-200)'
      } as React.CSSProperties}>
        <RRuleBuilder
          dateAdapter={AdapterLuxon as any}
          datePickerInitialDate={value?.datePickerInitialDate ? DateTime.fromISO(value.datePickerInitialDate) : DateTime.now()}
          rruleString={value?.rrule}
          showStartDate={true}
          onChange={handleRRuleChange}
          enableYearlyInterval={true}
          enableOpenOnClickDatePicker
          themeMode={theme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </div>
  )
}