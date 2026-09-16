export interface NoticiaOrdenable {
  pinned?: boolean | null
  publishedAt?: string | null
}

const instanteDe = (noticia: NoticiaOrdenable): number =>
  noticia.publishedAt ? new Date(noticia.publishedAt).getTime() : 0

/** Una noticia con fecha futura está escrita pero todavía no se muestra ni avisa */
export const estaPublicada = ({
  publishedAt,
  now,
}: {
  publishedAt?: string | null
  now: Date
}): boolean => Boolean(publishedAt) && instanteDe({ publishedAt }) <= now.getTime()

/** Fijadas primero y, dentro de cada grupo, la más reciente arriba */
export const ordenarNoticias = <T extends NoticiaOrdenable>(noticias: T[]): T[] =>
  [...noticias].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
    return instanteDe(b) - instanteDe(a)
  })

/** El cuerpo llega como texto plano y se guarda como richText de Lexical */
export const cuerpoRichText = (texto: string) => ({
  root: {
    type: 'root',
    children: texto
      .split('\n')
      .filter((linea) => linea.trim().length > 0)
      .map((text) => ({
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      })),
    direction: null,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})
