'use client'

import { useState } from 'react'
import { UserRoundCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTextos } from '@/components/IdiomaProvider'
import { rellenar } from '@/core/textos'
import { authClient } from '@/lib/auth/client'

/**
 * Mientras se está dentro como otra persona, una franja lo recuerda y deja
 * volver a la cuenta propia. Sin ella, uno se queda siendo el otro una hora.
 */
export function AvisoImpersonacion() {
  const t = useTextos()
  const { data } = authClient.useSession()
  const [saliendo, setSaliendo] = useState(false)

  const impersonando = (data?.session as { impersonatedBy?: unknown } | undefined)?.impersonatedBy
  if (!impersonando || !data) return null

  const volver = async () => {
    setSaliendo(true)
    const respuesta = await fetch('/api/auth/impersonar/terminar', {
      method: 'POST',
      credentials: 'include',
    })
    window.location.href = respuesta.ok ? '/admin/collections/users' : '/login'
  }

  return (
    <div className="sticky top-0 z-50 bg-pafe-orange-500 text-white">
      <div className="container flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <UserRoundCheck className="h-4 w-4" />
          {rellenar(t.impersonandoA, { nombre: data.user.name || data.user.email })}
        </span>
        <Button size="sm" variant="secondary" onClick={volver} disabled={saliendo}>
          {t.impersonarVolver}
        </Button>
      </div>
    </div>
  )
}
