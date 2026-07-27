/**
 * Corrige título y autoría de los materiales de la biblioteca profesional en la
 * colección `files`, tomando como fuente el manifiesto de destilado de la wiki.
 *
 * Por qué: los títulos y las autorías del manifiesto se verificaron uno a uno
 * contra la portada y los créditos de cada obra al redactar sus notas, y sacaron
 * a la luz 43 fichas erróneas en el catálogo (25 de autoría, 35 de título). Entre
 * ellas, atribuciones equivocadas de libro completo: «Pensamiento sistémico» a
 * Enrique Herrscher cuando es una obra colectiva de RELATES, «La práctica de la
 * psicoterapia» a Carl Gustav Jung cuando es de Fernández Liria y Rodríguez Vega,
 * o un ensayo de Guido Lagos Garay sobre Bateson atribuido a Bateson.
 *
 * Uso (dentro del devcontainer, desde apps/web):
 *   pnpm payload run scripts/fix-catalog-metadata.ts            # dry-run
 *   pnpm payload run scripts/fix-catalog-metadata.ts --apply    # escribe
 *
 * Contra otra base de datos (p. ej. producción), mismo patrón que seed-remote.sh:
 * exporta DATABASE_URL y PAYLOAD_SECRET antes de ejecutarlo.
 *
 * Es idempotente: en una segunda pasada no cambia nada.
 *
 * El emparejamiento va por `filename` (título + hash de contenido), nunca por
 * título: el título es precisamente el dato que se corrige.
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'

const APPLY = process.argv.includes('--apply')
const MANIFEST = path.resolve(
  import.meta.dirname,
  '../../../scripts/wiki-destilado/destilado-items.json',
)
const DB_FILES = path.resolve(import.meta.dirname, '../../../export/data/db-files.json')

interface ManifestItem {
  slug: string
  title: string
  authors: string[]
  portalUrl: string
}

const filenameOf = (portalUrl: string): string =>
  decodeURIComponent(new URL(portalUrl).pathname.split('/').pop() ?? '')

const slugifyName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const items: ManifestItem[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))

/**
 * Nombres que el catálogo usa como autoría. Se toman del volcado de producción
 * y del manifiesto: sirven para distinguir, entre las categorías actuales de un
 * material, las que son autoría (se sustituyen) de cualquier otra taxonomía
 * temática o de edad (se preserva intacta).
 */
const knownAuthorNames = new Set<string>()
for (const item of items) for (const a of item.authors) knownAuthorNames.add(a)
try {
  const dump: { categories: string[] }[] = JSON.parse(fs.readFileSync(DB_FILES, 'utf8'))
  for (const row of dump) for (const c of row.categories) knownAuthorNames.add(c)
} catch {
  console.warn('aviso: no se pudo leer db-files.json; solo se usarán los autores del manifiesto')
}

const payload: Payload = await getPayload({ config })

// --- Tipo de taxonomía que usa la autoría ------------------------------------
// No se inventa: se deduce de las taxonomías de autor que ya existen, para que
// las nuevas queden indistinguibles de las creadas a mano en el admin.
async function detectAuthorTaxonomyTypes(): Promise<string[]> {
  const counts = new Map<string, number>()
  const sample = [...knownAuthorNames].slice(0, 40)
  for (const name of sample) {
    const found = await payload.find({
      collection: 'taxonomy',
      where: { name: { equals: name } },
      limit: 1,
    })
    const types = (found.docs[0]?.payload as { types?: string[] } | undefined)?.types
    if (types?.length) {
      const key = JSON.stringify(types)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  if (counts.size === 0) return []
  const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return JSON.parse(best[0]) as string[]
}

const authorTypes = await detectAuthorTaxonomyTypes()
console.log(
  authorTypes.length
    ? `tipo de taxonomía para autoría detectado: ${JSON.stringify(authorTypes)}`
    : 'las taxonomías de autor existentes no declaran tipo; las nuevas se crearán igual',
)

const taxonomyCache = new Map<string, number>()

async function taxonomyIdFor(name: string): Promise<number | null> {
  const cached = taxonomyCache.get(name)
  if (cached !== undefined) return cached
  const found = await payload.find({
    collection: 'taxonomy',
    where: { name: { equals: name } },
    limit: 1,
  })
  let id = found.docs[0]?.id as number | undefined
  if (id === undefined) {
    if (!APPLY) {
      console.log(`    + crearía taxonomía de autor: "${name}"`)
      return null
    }
    const created = await payload.create({
      collection: 'taxonomy',
      data: {
        name,
        slug: slugifyName(name),
        ...(authorTypes.length ? { payload: { types: authorTypes } } : {}),
      } as never,
      overrideAccess: true,
    })
    id = created.id as number
    console.log(`    + taxonomía de autor creada: "${name}" (id ${id})`)
  }
  taxonomyCache.set(name, id)
  return id
}

// --- Recorrido de los materiales ---------------------------------------------
let notFound = 0
let titleFixes = 0
let authorFixes = 0
let untouched = 0
/** autoría retirada → materiales de los que se retira (para contar huérfanas en dry-run) */
const removedAuthors = new Map<string, Set<number>>()

for (const item of items) {
  const filename = filenameOf(item.portalUrl)
  const found = await payload.find({
    collection: 'files',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 1,
  })
  const doc = found.docs[0]
  if (!doc) {
    console.warn(`SIN COINCIDENCIA en files: ${filename}`)
    notFound++
    continue
  }

  // El título almacenado, tal cual: la comparación es literal contra el manifiesto.
  // Quitar la extensión aquí haría que «La Familia en la Ópera.pdf» pasara por correcto
  // y el catálogo seguiría mostrando el «.pdf» al usuario.
  const storedTitle = (doc.title ?? '').trim()
  const currentTitle = storedTitle.replace(/\.pdf$/i, '')
  const currentCats = (doc.categories ?? []) as (number | { id: number; name: string })[]
  const currentCatNames = currentCats.map((c) =>
    typeof c === 'number' ? String(c) : c.name,
  )
  const currentAuthors = currentCatNames.filter((n) => knownAuthorNames.has(n))
  const preserved = currentCats.filter(
    (c) => !(typeof c !== 'number' && knownAuthorNames.has(c.name)),
  )

  const titleWrong = storedTitle !== item.title
  const authorsWrong =
    [...currentAuthors].sort().join(' | ') !== [...item.authors].sort().join(' | ')

  if (!titleWrong && !authorsWrong) {
    untouched++
    continue
  }

  console.log(`\n${filename}`)
  if (titleWrong) {
    console.log(`  título:  ${storedTitle}\n       →   ${item.title}`)
    titleFixes++
  }
  if (authorsWrong) {
    console.log(`  autoría: ${currentAuthors.join(', ') || '(ninguna)'}`)
    console.log(`       →   ${item.authors.join(', ') || '(ninguna)'}`)
    authorFixes++
    for (const name of currentAuthors) {
      if (item.authors.includes(name)) continue
      const set = removedAuthors.get(name) ?? new Set<number>()
      set.add(doc.id as number)
      removedAuthors.set(name, set)
    }
  }

  const data: Record<string, unknown> = {}
  if (titleWrong) data.title = item.title
  if (authorsWrong) {
    const ids: number[] = []
    for (const name of item.authors) {
      const id = await taxonomyIdFor(name)
      if (id !== null) ids.push(id)
    }
    const preservedIds = preserved.map((c) => (typeof c === 'number' ? c : c.id))
    data.categories = [...preservedIds, ...ids]
    if (preservedIds.length) {
      console.log(`  (se conservan ${preservedIds.length} categorías no de autoría)`)
    }
  }

  if (APPLY) {
    await payload.update({
      collection: 'files',
      id: doc.id,
      data: data as never,
      overrideAccess: true,
    })
  }
}

// --- Autorías que dejan de usarse --------------------------------------------
// Al corregir una atribución errónea, su término de taxonomía puede quedarse sin
// ningún material. No se borra: podría estar en uso en otras colecciones y el
// borrado es irreversible. Se listan para que alguien decida.
if (removedAuthors.size) {
  const orphans: string[] = []
  for (const [name, affectedFiles] of removedAuthors) {
    const tax = await payload.find({
      collection: 'taxonomy',
      where: { name: { equals: name } },
      limit: 1,
    })
    const id = tax.docs[0]?.id
    if (id === undefined) continue
    const used = await payload.count({
      collection: 'files',
      where: { categories: { in: [id] } } as never,
    })
    // en dry-run los materiales afectados aún la llevan: se descuentan
    const remaining = APPLY ? used.totalDocs : used.totalDocs - affectedFiles.size
    if (remaining <= 0) orphans.push(`${name} (taxonomía ${id})`)
  }
  if (orphans.length) {
    console.log(
      `\nAutorías que ${APPLY ? 'ya no etiquetan' : 'dejarían de etiquetar'} ningún material, ` +
        'revisar antes de borrarlas:',
    )
    for (const o of orphans.sort()) console.log(`  - ${o}`)
  }
}

console.log(
  [
    '',
    APPLY ? '--- aplicado ---' : '--- dry-run, no se ha escrito nada (usa --apply) ---',
    `materiales revisados:   ${items.length}`,
    `ya correctos:           ${untouched}`,
    `títulos a corregir:     ${titleFixes}`,
    `autorías a corregir:    ${authorFixes}`,
    `sin coincidencia:       ${notFound}`,
  ].join('\n'),
)

process.exit(0)
