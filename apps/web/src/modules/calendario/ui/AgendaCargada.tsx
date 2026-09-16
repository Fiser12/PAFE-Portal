'use client'

import useSWR from 'swr'
import { useTextos } from '@/components/IdiomaProvider'
import { cargarAgendaCompleta } from '../actions'
import { Agenda } from './Agenda'

export function AgendaCargada() {
  const t = useTextos()
  const { data } = useSWR('agenda', cargarAgendaCompleta, { revalidateOnFocus: false })

  if (!data) return <p className="py-6 text-sm text-muted-foreground">{t.cargando}</p>

  return (
    <Agenda
      ocurrencias={data.ocurrencias}
      noticias={data.noticias}
      nombres={data.nombres}
      fallidos={data.fallidos}
    />
  )
}
