export const TABLON_NOTIFICATION_TYPES = ['noticia'] as const

export type TablonNotificationType = (typeof TABLON_NOTIFICATION_TYPES)[number]

/** Nadie recibe aviso de lo que publica, aunque esté suscrito al área */
export const destinatariosDelAviso = ({
  suscriptores,
  autorId,
}: {
  suscriptores: number[]
  autorId?: number | null
}): number[] => [...new Set(suscriptores)].filter((id) => id !== autorId)

export const avisoDeNoticia = ({
  title,
  area,
}: {
  title: string
  area: string
}): { type: TablonNotificationType; message: string } => ({
  type: 'noticia',
  message: `Novedad en ${area}: ${title}`,
})

const escaparHtml = (texto: string): string =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const correoDeNoticia = ({
  title,
  area,
  url,
}: {
  title: string
  area: string
  url: string
}): { subject: string; text: string; html: string } => {
  const eu = `${area} atalean berri bat dago: ${title}. Ikusi hemen: ${url}`
  const es = `Hay una novedad en ${area}: ${title}. Puedes verla en ${url}`
  return {
    subject: `${area}: ${title}`,
    text: `${eu}\n\n${es}`,
    html: `<p>${escaparHtml(eu)}</p><p>${escaparHtml(es)}</p>`,
  }
}

/** Solo se sigue lo que es un área del tablón, aunque pidan seguir otra cosa */
export const soloAreas = ({
  pedidas,
  areasReales,
}: {
  pedidas: number[]
  areasReales: number[]
}): number[] => [...new Set(pedidas)].filter((id) => areasReales.includes(id))
