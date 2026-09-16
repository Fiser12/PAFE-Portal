import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const wikiRoot = join(dirname(webRoot), 'wiki')
const fichasHtml = join(wikiRoot, 'public', 'libros')
const indexFile = join(webRoot, 'src', 'modules', 'catalog', 'wiki-fichas.json')

const tituloDe = (html) => html.match(/<title>([^<]*)<\/title>/)?.[1].trim() ?? null

/**
 * Índice título → ficha, para enlazar cada material del catálogo con su página.
 * Se lee del HTML construido, no del markdown: Quartz decide el slug (lo pasa a
 * minúsculas) y en macOS, insensible a mayúsculas, un slug mal derivado parece
 * correcto y luego rompe en el despliegue.
 */
export function generarIndiceDeFichas() {
  if (!existsSync(fichasHtml)) {
    throw new Error(`No hay wiki construida en ${fichasHtml}: ejecuta antes pnpm wiki:build`)
  }

  // Los alias resuelven erratas de los títulos del catálogo y se revisan a mano
  const aliasPrevios = new Map(
    existsSync(indexFile)
      ? JSON.parse(readFileSync(indexFile, 'utf8'))
          .filter((f) => f.alias?.length)
          .map((f) => [f.path, f.alias])
      : [],
  )

  const fichas = readdirSync(fichasHtml)
    // index.html es la portada de la sección, no un libro
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .map((f) => {
      const title = tituloDe(readFileSync(join(fichasHtml, f), 'utf8'))
      if (!title) return null
      const path = `/wiki/libros/${f.replace(/\.html$/, '')}`
      const alias = aliasPrevios.get(path)
      return alias ? { title, path, alias } : { title, path }
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, 'es'))

  writeFileSync(indexFile, `${JSON.stringify(fichas, null, 2)}\n`, 'utf8')
  console.log(`[wiki] ${fichas.length} fichas indexadas`)
  return fichas
}

if (import.meta.url === `file://${process.argv[1]}`) generarIndiceDeFichas()
