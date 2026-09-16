import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = dirname(dirname(webRoot))
const fichas = JSON.parse(readFileSync(join(webRoot, 'src/modules/catalog/wiki-fichas.json'), 'utf8'))

const normalizar = (t) =>
  t
    .replace(/\.(pdf|epub|docx?|mobi)$/i, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const bigramas = (t) => {
  const s = normalizar(t).replace(/ /g, '')
  return new Set(Array.from({ length: Math.max(s.length - 1, 0) }, (_, i) => s.slice(i, i + 2)))
}

/** Coeficiente de Dice: 1 es idéntico, 0 no comparte nada */
const parecido = (a, b) => {
  const [x, y] = [bigramas(a), bigramas(b)]
  if (!x.size || !y.size) return 0
  const comunes = [...x].filter((g) => y.has(g)).length
  return (2 * comunes) / (x.size + y.size)
}

const exacto = new Map()
for (const f of fichas) {
  for (const t of [f.title, ...(f.alias ?? [])]) exacto.set(normalizar(t), f)
}

const fuentes = [
  ['descargables', 'export/data/db-files.json'],
  ['reservables', 'export/data/catalog-items.json'],
  ['recursos externos', 'export/data/external-resources.json'],
]

const usadas = new Set()
for (const [nombre, ruta] of fuentes) {
  const fichero = join(repoRoot, ruta)
  if (!existsSync(fichero)) {
    console.log(`\n## ${nombre}: sin datos (${ruta})`)
    continue
  }
  const crudo = JSON.parse(readFileSync(fichero, 'utf8'))
  const items = (Array.isArray(crudo) ? crudo : crudo.docs) ?? []

  const casan = []
  const dudosos = []
  const sinNada = []
  for (const item of items) {
    const titulo = (item.title ?? item.filename ?? item.name ?? '').trim()
    if (!titulo) continue
    const ficha = exacto.get(normalizar(titulo))
    if (ficha) {
      casan.push(titulo)
      usadas.add(ficha.path)
      continue
    }
    const mejor = fichas
      .map((f) => ({ f, p: parecido(titulo, f.title) }))
      .sort((a, b) => b.p - a.p)[0]
    if (mejor && mejor.p >= 0.7) dudosos.push({ titulo, ficha: mejor.f.title, p: mejor.p })
    else sinNada.push(titulo)
  }

  console.log(`\n## ${nombre}: ${items.length} materiales`)
  console.log(`   casan: ${casan.length}   a revisar: ${dudosos.length}   sin ficha: ${sinNada.length}`)
  for (const d of dudosos.sort((a, b) => b.p - a.p)) {
    console.log(`   [${d.p.toFixed(2)}] ${d.titulo}\n           -> ${d.ficha}`)
  }
}

const huerfanas = fichas.filter((f) => !usadas.has(f.path))
console.log(`\n## fichas sin material: ${huerfanas.length}/${fichas.length}`)
for (const f of huerfanas) console.log(`   ${f.title}`)
