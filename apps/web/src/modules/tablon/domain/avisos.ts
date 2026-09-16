import { correoBilingue, type Correo } from '@/modules/avisos'

export const TABLON_NOTIFICATION_TYPES = ['noticia'] as const

export type TablonNotificationType = (typeof TABLON_NOTIFICATION_TYPES)[number]

/**
 * Nadie recibe aviso de lo que publica, y nadie lo recibe dos veces: si un
 * fallo dejó el aviso a medias, el reintento solo alcanza a quien falta.
 */
export const destinatariosDelAviso = ({
  suscriptores,
  autorId,
  yaAvisados = [],
}: {
  suscriptores: number[]
  autorId?: number | null
  yaAvisados?: number[]
}): number[] =>
  [...new Set(suscriptores)].filter((id) => id !== autorId && !yaAvisados.includes(id))

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

export const correoDeNoticia = ({
  title,
  area,
  url,
}: {
  title: string
  area: string
  url: string
}): Correo =>
  correoBilingue({
    subject: `${area}: ${title}`,
    eu: `${area} atalean berri bat dago: ${title}. Ikusi hemen: ${url}`,
    es: `Hay una novedad en ${area}: ${title}. Puedes verla en ${url}`,
  })
