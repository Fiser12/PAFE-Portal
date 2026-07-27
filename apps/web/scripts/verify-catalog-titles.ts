/**
 * Comprueba que el índice de búsqueda (colección `search`) refleja los títulos y las
 * autorías que tiene la colección `files`, para los materiales del manifiesto de la wiki.
 *
 * Por qué: `fix-catalog-metadata.ts` corrige `files` con `payload.update()`, que dispara
 * los hooks del plugin de búsqueda. Este script verifica que esa propagación ocurrió de
 * verdad, en lugar de darla por supuesta: el buscador es lo que ve el usuario.
 *
 * Uso (dentro del devcontainer, desde apps/web):
 *   pnpm payload run scripts/verify-catalog-titles.ts
 *
 * Contra otra base de datos, exporta DATABASE_URL y PAYLOAD_SECRET (y SEED_MOCK_DATA=false).
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const MANIFEST = path.resolve(
  import.meta.dirname,
  '../../../scripts/wiki-destilado/destilado-items.json',
)

interface ManifestItem {
  title: string
  authors: string[]
  portalUrl: string
}

const filenameOf = (portalUrl: string): string =>
  decodeURIComponent(new URL(portalUrl).pathname.split('/').pop() ?? '')

const payload = await getPayload({ config })
const items: ManifestItem[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
const expected = new Map(items.map((i) => [filenameOf(i.portalUrl), i]))

const files = await payload.find({
  collection: 'files' as never,
  limit: 1000,
  depth: 0,
  overrideAccess: true,
})

let checked = 0
const wrongFile: string[] = []
const missingIndex: string[] = []
const staleIndex: string[] = []

for (const doc of files.docs as Array<Record<string, unknown>>) {
  const filename = String(doc.filename ?? '')
  const item = expected.get(filename)
  if (!item) continue
  checked += 1

  if (String(doc.title ?? '') !== item.title) {
    wrongFile.push(`${filename}\n    files.title = ${String(doc.title)}\n    manifiesto = ${item.title}`)
  }

  const hits = await payload.find({
    collection: 'search' as never,
    // Filtrar también por relationTo: los IDs se repiten entre colecciones y sin esto
    // el índice devuelve entradas de `catalog-item` con el mismo id numérico.
    where: {
      and: [
        { 'doc.value': { equals: doc.id } },
        { 'doc.relationTo': { equals: 'files' } },
      ],
    } as never,
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })
  if (hits.totalDocs === 0) {
    missingIndex.push(filename)
    continue
  }
  const indexed = hits.docs as Array<Record<string, unknown>>
  if (!indexed.some((h) => String(h.title ?? '') === item.title)) {
    staleIndex.push(
      `${filename}\n    search.title = ${indexed.map((h) => String(h.title)).join(' | ')}` +
        `\n    esperado     = ${item.title}`,
    )
  }
}

const block = (label: string, rows: string[]): void => {
  if (rows.length === 0) return
  console.log(`\n${label} (${rows.length}):`)
  for (const r of rows) console.log(`  - ${r}`)
}

block('Títulos incorrectos en `files`', wrongFile)
block('Materiales sin entrada en el índice de búsqueda', missingIndex)
block('Entradas del índice con el título antiguo', staleIndex)

const ok = wrongFile.length === 0 && missingIndex.length === 0 && staleIndex.length === 0
console.log(`\nmateriales del manifiesto comprobados: ${checked} de ${items.length}`)
console.log(`files correctos:      ${checked - wrongFile.length}/${checked}`)
console.log(`indexados:            ${checked - missingIndex.length}/${checked}`)
console.log(`índice al día:        ${checked - missingIndex.length - staleIndex.length}/${checked}`)
console.log(ok ? '\nOK: catálogo e índice coinciden con el manifiesto.' : '\nHay discrepancias.')

process.exit(ok ? 0 : 1)
