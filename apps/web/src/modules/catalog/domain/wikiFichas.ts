import fichasJson from '../wiki-fichas.json'

interface FichaDeLaWiki {
  title: string
  path: string
  /** Títulos con los que aparece el mismo libro en el catálogo */
  alias?: string[]
}

const fichas: FichaDeLaWiki[] = fichasJson

/**
 * Los títulos del catálogo y los de la wiki difieren en tildes, mayúsculas,
 * puntuación y extensión del fichero. Las erratas que no arregla la
 * normalización van como alias en el índice.
 */
const normalizar = (titulo: string): string =>
  titulo
    .replace(/\.(pdf|epub|docx?|mobi)$/i, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const porTitulo = new Map(
  fichas.flatMap((ficha) =>
    [ficha.title, ...(ficha.alias ?? [])].map((titulo) => [normalizar(titulo), ficha.path] as const),
  ),
)

/** Ruta de la ficha de la wiki para un material, o null si ese libro no tiene ficha */
export const fichaDeLaWiki = (titulo?: string | null): string | null =>
  titulo ? (porTitulo.get(normalizar(titulo)) ?? null) : null
