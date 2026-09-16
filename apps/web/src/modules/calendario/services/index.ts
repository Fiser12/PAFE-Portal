import { CALENDARIOS, urlDelFeed } from '../domain/calendarios'
import { leerCalendario, type CalendarioIcs } from '../domain/ics'
import { ocurrenciasEntre, type Ocurrencia } from '../domain/ocurrencias'

/** Los calendarios cambian poco: no hace falta ir a Google en cada visita */
const MINUTOS_DE_CACHE = 15

const descargar = async (fuente: string, id: string): Promise<CalendarioIcs | null> => {
  try {
    const respuesta = await fetch(urlDelFeed(fuente), {
      next: { revalidate: MINUTOS_DE_CACHE * 60 },
    })
    if (!respuesta.ok) return null
    return leerCalendario(await respuesta.text(), id)
  } catch {
    // Un calendario que no responde no debe dejar la página sin los demás
    return null
  }
}

export interface AgendaCargada {
  ocurrencias: Ocurrencia[]
  nombres: Record<string, string>
  /** Calendarios que no se pudieron leer, para poder avisar sin mentir */
  fallidos: string[]
}

export const cargarAgenda = async (desde: Date, hasta: Date): Promise<AgendaCargada> => {
  const leidos = await Promise.all(CALENDARIOS.map(({ fuente, id }) => descargar(fuente, id)))

  const nombres: Record<string, string> = {}
  const fallidos: string[] = []
  const eventos = []

  for (const [indice, calendario] of leidos.entries()) {
    if (!calendario) {
      const fallido = CALENDARIOS[indice]
      if (fallido) fallidos.push(fallido.id)
      continue
    }
    nombres[calendario.id] = calendario.nombre
    eventos.push(...calendario.eventos)
  }

  return { ocurrencias: ocurrenciasEntre(eventos, desde, hasta), nombres, fallidos }
}
