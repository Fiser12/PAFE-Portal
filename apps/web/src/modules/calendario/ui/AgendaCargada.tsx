'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useTextos } from '@/components/IdiomaProvider'
import { cargarAgendaCompleta } from '../actions'
import { Agenda } from './Agenda'

export function AgendaCargada() {
  const t = useTextos()
  const [periodo, setPeriodo] = useState('')
  const { data, error } = useSWR(
    ['agenda', periodo],
    () => cargarAgendaCompleta(periodo || undefined),
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  if (error) return <p role="alert">{t.calFallidos}</p>

  if (!data) return <p className="py-6 text-sm text-muted-foreground">{t.cargando}</p>

  return (
    <Agenda
      onPeriodoChange={setPeriodo}
      ocurrencias={data.ocurrencias}
      noticias={data.noticias}
      nombres={data.nombres}
      fallidos={data.fallidos}
    />
  )
}
