'use client'

import { useState } from 'react'
import { Button, toast, useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { isAdmin, puedeImpersonar } from '@/core/permissions'

/**
 * «Entrar como esta persona» en su ficha. Solo lo ve quien tiene el rol de
 * impersonar, y no sale en la de un admin; el servidor lo vuelve a comprobar.
 */
export function ImpersonarField() {
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const roles = useFormFields(([fields]) => fields.role?.value)
  const [entrando, setEntrando] = useState(false)

  if (!id || !puedeImpersonar(user) || isAdmin({ role: roles }) || String(user?.id) === String(id)) {
    return null
  }

  const entrar = async () => {
    setEntrando(true)
    try {
      const respuesta = await fetch('/api/auth/impersonar/iniciar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: String(id) }),
      })
      if (respuesta.ok) {
        window.location.href = '/'
        return
      }
      const { message } = await respuesta.json().catch(() => ({ message: undefined }))
      toast.error(message ?? 'No se ha podido entrar como esta persona')
    } catch {
      toast.error('No se ha podido entrar como esta persona')
    }
    setEntrando(false)
  }

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <Button buttonStyle="secondary" size="medium" onClick={entrar} disabled={entrando}>
        Entrar como esta persona
      </Button>
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: 12, marginTop: 4 }}>
        Verás el portal como lo ve ella durante una hora, o hasta que vuelvas a tu cuenta.
      </p>
    </div>
  )
}
