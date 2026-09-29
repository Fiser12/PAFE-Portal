'use server'

import { isActiveUser, isAdmin } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import { cargarAgenda } from '../services'
import type { OcurrenciaPlana } from '../ui/Agenda'

export interface AgendaData {
  ocurrencias: OcurrenciaPlana[]
  nombres: Record<string, string>
  fallidos: string[]
  /** Quien administra el portal ve el «+» que lleva a Google Calendar */
  puedeEditar: boolean
}

const VACIO: AgendaData = { ocurrencias: [], nombres: {}, fallidos: [], puedeEditar: false }

/** Lo que se pide a cada fuente; quien recorta a la semana es el dominio */
const SEMANAS_ATRAS = 6
const SEMANAS_ADELANTE = 26
const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000

export async function cargarAgendaCompleta(periodo?: string): Promise<AgendaData> {
  const { user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return VACIO

  if (periodo && !/^\d{4}-\d{2}-01$/.test(periodo)) throw new Error('Periodo inválido')
  const ahora = periodo ? new Date(`${periodo}T12:00:00Z`).getTime() : Date.now()
  if (!Number.isFinite(ahora)) throw new Error('Periodo inválido')
  const desde = new Date(ahora - SEMANAS_ATRAS * UNA_SEMANA)
  const hasta = new Date(ahora + SEMANAS_ADELANTE * UNA_SEMANA)

  const calendario = await cargarAgenda(desde, hasta)

  return {
    // Las fechas no cruzan la frontera servidor-cliente como Date
    ocurrencias: calendario.ocurrencias.map((o) => ({
      ...o,
      inicio: o.inicio.toISOString(),
      fin: o.fin.toISOString(),
    })),
    nombres: calendario.nombres,
    fallidos: calendario.fallidos,
    puedeEditar: isAdmin(user),
  }
}
