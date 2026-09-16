'use client'

import useSWR from 'swr'
import { useTextos } from '@/components/IdiomaProvider'
import { cargarCalendario } from '../actions'
import { Calendario } from './Calendario'

export function CalendarioCargado() {
  const t = useTextos()
  const { data } = useSWR('calendario', cargarCalendario, { revalidateOnFocus: false })

  if (!data) return <p className="py-6 text-sm text-muted-foreground">{t.cargando}</p>

  return (
    <Calendario
      ocurrencias={data.ocurrencias}
      nombres={data.nombres}
      fallidos={data.fallidos}
    />
  )
}
