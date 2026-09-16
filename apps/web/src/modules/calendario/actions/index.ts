'use server'

import { isActiveUser, isStaff } from '@/core/permissions'
import { getIdioma } from '@/utilities/getIdioma'
import { getSessionUser } from '@/utilities/getSessionUser'
import { noticiasDelTablon } from '@/modules/tablon/services'
import type { Noticia } from '@/payload-types'
import type { NoticiaDeAgenda } from '../domain/entradas'
import { cargarAgenda } from '../services'
import type { OcurrenciaPlana } from '../ui/Agenda'

export interface AgendaData {
  ocurrencias: OcurrenciaPlana[]
  noticias: NoticiaDeAgenda[]
  nombres: Record<string, string>
  fallidos: string[]
}

const VACIO: AgendaData = { ocurrencias: [], noticias: [], nombres: {}, fallidos: [] }

/**
 * Los eventos se piden desde hoy: una agenda no enseña lo que ya pasó. Las
 * noticias sí se traen de atrás, que es de donde salen las novedades.
 */
const SEMANAS_ATRAS = 4
const SEMANAS_ADELANTE = 26
const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000

const resumenDe = (noticia: Noticia): string => {
  const root = (noticia.body as { root?: { children?: unknown[] } } | null)?.root
  const parrafos = (root?.children ?? []) as { children?: { text?: string }[] }[]
  return parrafos
    .flatMap((p) => (p.children ?? []).map((t) => t.text ?? ''))
    .join(' ')
    .slice(0, 160)
}

export async function cargarAgendaCompleta(): Promise<AgendaData> {
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) return VACIO

  const ahora = Date.now()
  const desdeNoticias = new Date(ahora - SEMANAS_ATRAS * UNA_SEMANA)
  const hasta = new Date(ahora + SEMANAS_ADELANTE * UNA_SEMANA)
  // Un poco antes de hoy para no perder lo que empezó esta madrugada
  const desdeEventos = new Date(ahora - 36 * 60 * 60 * 1000)

  const [calendario, noticias] = await Promise.all([
    cargarAgenda(desdeEventos, hasta),
    noticiasDelTablon({
      payload,
      user,
      now: new Date(),
      locale: await getIdioma(),
      limit: 30,
    }).catch(() => [] as Noticia[]),
  ])

  return {
    // Las fechas no cruzan la frontera servidor-cliente como Date
    ocurrencias: calendario.ocurrencias.map((o) => ({
      ...o,
      inicio: o.inicio.toISOString(),
      fin: o.fin.toISOString(),
    })),
    noticias: noticias
      .filter((noticia) => new Date(noticia.publishedAt) >= desdeNoticias)
      .map((noticia) => ({
        id: noticia.id,
        titulo: noticia.title,
        resumen: resumenDe(noticia),
        area: noticia.area,
        fijada: Boolean(noticia.pinned),
        publicadaEn: noticia.publishedAt,
      })),
    nombres: calendario.nombres,
    fallidos: calendario.fallidos,
  }
}

export { isStaff }
