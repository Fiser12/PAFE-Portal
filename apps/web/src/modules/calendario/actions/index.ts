'use server'

import { isActiveUser } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'
import { cargarAgenda } from '../services'
import type { OcurrenciaPlana } from '../ui/Calendario'

export interface CalendarioData {
  ocurrencias: OcurrenciaPlana[]
  nombres: Record<string, string>
  fallidos: string[]
}

const VACIO: CalendarioData = { ocurrencias: [], nombres: {}, fallidos: [] }

/** Cuánto se mira hacia atrás y hacia delante al pedir el calendario */
const SEMANAS_ATRAS = 4
const SEMANAS_ADELANTE = 26
const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000

export async function cargarCalendario(): Promise<CalendarioData> {
  const { user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return VACIO

  const ahora = Date.now()
  const { ocurrencias, nombres, fallidos } = await cargarAgenda(
    new Date(ahora - SEMANAS_ATRAS * UNA_SEMANA),
    new Date(ahora + SEMANAS_ADELANTE * UNA_SEMANA),
  )

  return {
    // Las fechas no cruzan la frontera servidor-cliente como Date
    ocurrencias: ocurrencias.map((o) => ({
      ...o,
      inicio: o.inicio.toISOString(),
      fin: o.fin.toISOString(),
    })),
    nombres,
    fallidos,
  }
}
