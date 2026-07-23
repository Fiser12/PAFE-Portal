import type React from 'react'

export const fieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '34px',
  padding: '6px 9px',
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-elevation-800)',
  fontSize: '12px',
}

export const buttonStyle: React.CSSProperties = {
  minHeight: '32px',
  padding: '5px 10px',
  border: '1px solid var(--theme-elevation-250)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-elevation-100)',
  color: 'var(--theme-elevation-800)',
  cursor: 'pointer',
  fontSize: '12px',
}

export const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  color: 'var(--theme-error-600)',
  borderColor: 'var(--theme-error-300)',
}
