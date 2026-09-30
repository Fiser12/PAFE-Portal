import type { Payload } from 'payload'
// Imports estáticos: el bundler los incluye en el build, así el seed funciona
// también en serverless (fs.readFileSync no encuentra los archivos en Vercel)
import librosJson from './data/libros.json'
import juegosJson from './data/juegos.json'
import programasJson from './data/programas.json'
import cortosJson from './data/cortos.json'

// Totales esperados del catálogo, derivados de los datos: el guard del seed
// compara contra esto para saber si ya está todo sembrado (o completar lo
// que falte tras una siembra interrumpida)
const EXPECTED_ITEMS = librosJson.length + juegosJson.length + programasJson.length
const EXPECTED_CORTOS = cortosJson.length

// Extrae el detalle campo-a-campo de un ValidationError de Payload.
// El `message` de Payload solo lista los `path`; el motivo real (requerido,
// único, etc.) vive en `err.data.errors[i].message`.
const describeError = (err: unknown): string => {
  const e = err as { message?: string; data?: { errors?: unknown[] } }
  const lines: string[] = [e?.message ?? String(err)]
  const fieldErrors = e?.data?.errors
  if (Array.isArray(fieldErrors)) {
    for (const fe of fieldErrors as Array<{ path?: string; label?: unknown; message?: string }>) {
      const field = fe.path ?? (typeof fe.label === 'string' ? fe.label : JSON.stringify(fe.label))
      lines.push(`    · ${field}: ${fe.message}`)
    }
  }
  return lines.join('\n')
}

// Upsert genérico: busca por los campos de `match` (equals) y reutiliza
// (update) el documento existente o lo crea. Hace el seed idempotente frente
// a los índices únicos (taxonomy.slug, groups.name, …) al re-sembrar.
async function upsert(
  payload: Payload,
  collection: string,
  match: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<number> {
  const where = Object.fromEntries(
    Object.entries(match).map(([field, value]) => [field, { equals: value }]),
  )
  const existing = await payload.find({
    collection: collection as never,
    where: where as never,
    limit: 1,
  })
  const doc = existing.docs[0] as { id: number | string } | undefined
  const saved = (doc
    ? await payload.update({
        collection: collection as never,
        id: doc.id as never,
        data: data as never,
        overrideAccess: true,
      })
    : await payload.create({
        collection: collection as never,
        data: data as never,
        overrideAccess: true,
      })) as { id: number | string }
  return saved.id as number
}

// richText de Lexical con un párrafo por cada string
const richTextParas = (paras: string[]) => ({
  root: {
    type: 'root',
    children: paras.map((text) => ({
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

// --- Taxonomía del catálogo ---------------------------------------------
// Tres facetas planas (el plugin no tiene jerarquía); la faceta viaja en
// `payload.types` para que la UI agrupe los selectores.
const TAXONOMY: { slug: string; name: string; type: string }[] = [
  { slug: 'emociones-y-regulacion', name: 'Emociones y regulación', type: 'tematica' },
  { slug: 'trauma-apego-y-vinculo', name: 'Trauma, apego y vínculo', type: 'tematica' },
  { slug: 'acogimiento-y-adopcion', name: 'Acogimiento y adopción', type: 'tematica' },
  { slug: 'educacion-afectivo-sexual', name: 'Educación afectivo-sexual', type: 'tematica' },
  { slug: 'convivencia-y-relaciones', name: 'Convivencia y relaciones', type: 'tematica' },
  { slug: 'desarrollo-y-aprendizaje', name: 'Desarrollo y aprendizaje', type: 'tematica' },
  { slug: 'salud-y-habitos', name: 'Salud y hábitos', type: 'tematica' },
  { slug: 'identidad-y-autoestima', name: 'Identidad y autoestima', type: 'tematica' },
  { slug: 'familia-y-parentalidad', name: 'Familia y parentalidad', type: 'tematica' },
  { slug: 'edad-0-2', name: '0–2 años', type: 'edad' },
  { slug: 'edad-3-5', name: '3–5 años', type: 'edad' },
  { slug: 'edad-6-9', name: '6–9 años', type: 'edad' },
  { slug: 'edad-10-12', name: '10–12 años', type: 'edad' },
  { slug: 'adolescentes', name: 'Adolescentes', type: 'edad' },
  { slug: 'adultos', name: 'Adultos', type: 'edad' },
  { slug: 'nna', name: 'Chicos y chicas (NNA)', type: 'destinatario' },
  { slug: 'familias', name: 'Familias acogedoras', type: 'destinatario' },
  { slug: 'profesionales', name: 'Profesionales', type: 'destinatario' },
]


interface CatalogItemData {
  type: string
  title: string
  author: string | null
  language: string | null
  quantity: number
  content: string[] | null
  categories: string[]
  coverTheme: string
}

interface CortoData {
  page: number
  title: string
  url: string
  duration: number | null
  valores: string[]
  description: string
  categories: string[]
  coverTheme: string
}

export async function seedMockData(payload: Payload): Promise<void> {
  // --- ¿Catálogo real ya sembrado? ------------------------------------------
  const realTax = await payload.find({
    collection: 'taxonomy',
    where: { slug: { equals: 'emociones-y-regulacion' } },
    limit: 1,
  })
  const catCount = await payload.count({ collection: 'catalog-item' })
  const extCount = await payload.count({ collection: 'external-resources' })
  if (
    realTax.totalDocs > 0 &&
    catCount.totalDocs >= EXPECTED_ITEMS &&
    extCount.totalDocs >= EXPECTED_CORTOS
  ) {
    return
  }

  // --- Limpieza del mock antiguo --------------------------------------------
  // Si hay datos de catálogo pero no existe la taxonomía real, es el dataset
  // mock: se elimina entero (reservas primero por la relación con los items).
  if (realTax.totalDocs === 0) {
    payload.logger.info('[seed] eliminando datos mock del catálogo…')
    for (const collection of ['reservation', 'catalog-item', 'files', 'external-resources', 'taxonomy']) {
      try {
        await payload.delete({
          collection: collection as never,
          where: { id: { exists: true } } as never,
          overrideAccess: true,
        })
      } catch (err) {
        payload.logger.warn(`[seed] limpieza de ${collection}: ${describeError(err)}`)
      }
    }
  }

  payload.logger.info('[seed] poblando catálogo real…')

  // --- Taxonomías -----------------------------------------------------------
  const taxIds: Record<string, number> = {}
  for (const t of TAXONOMY) {
    try {
      taxIds[t.slug] = await upsert(
        payload,
        'taxonomy',
        { slug: t.slug },
        { name: t.name, slug: t.slug, payload: { types: [t.type] } },
      )
    } catch (err) {
      payload.logger.error(`[seed] taxonomía "${t.slug}": ${describeError(err)}`)
    }
  }
  const catsFor = (slugs: string[]): number[] =>
    slugs.map((s) => taxIds[s]).filter((id): id is number => typeof id === 'number')

  // --- Grupos (name es único → upsert) --------------------------------------
  await upsert(payload, 'groups', { name: 'Grupo A' }, {
    name: 'Grupo A',
    description: 'Grupo de prueba',
  })
  await upsert(payload, 'groups', { name: 'Grupo B' }, {
    name: 'Grupo B',
    description: 'Segundo grupo de prueba',
  })

  // --- Catálogo reservable (libros, juegos y programas reales) --------------
  // Sin portada: media no funciona en serverless y las carátulas reales se
  // subirán desde el admin (por eso `cover` es opcional)
  const items: CatalogItemData[] = [
    ...(librosJson as CatalogItemData[]),
    ...(juegosJson as CatalogItemData[]),
    ...(programasJson as CatalogItemData[]),
  ]
  const catalogIds: number[] = []
  for (const item of items) {
    try {
      const id = await upsert(
        payload,
        'catalog-item',
        { title: item.title, type: item.type },
        {
          title: item.title,
          type: item.type,
          author: item.author ?? undefined,
          language: item.language ?? undefined,
          quantity: item.quantity,
          // «Si no hay content, no se pone»: solo el texto real de las fichas
          content: item.content && item.content.length > 0 ? richTextParas(item.content) : undefined,
          categories: catsFor(item.categories),
        },
      )
      catalogIds.push(id)
    } catch (err) {
      payload.logger.warn(`[seed] "${item.title}": ${describeError(err)}`)
    }
  }
  payload.logger.info(`[seed] ${catalogIds.length}/${items.length} materiales reservables`)

  // --- Cortometrajes (recursos externos, sin reserva) -----------------------
  const cortos = cortosJson as CortoData[]
  const externalIds: number[] = []
  for (const corto of cortos) {
    try {
      const valores =
        corto.valores.length > 0 ? ` Valores: ${corto.valores.join(', ').toLowerCase()}.` : ''
      const id = await upsert(
        payload,
        'external-resources',
        { title: corto.title },
        {
          title: corto.title,
          type: 'video',
          url: corto.url,
          duration: corto.duration ?? undefined,
          description: `${corto.description}${valores}`,
          categories: catsFor(corto.categories),
        },
      )
      externalIds.push(id)
    } catch (err) {
      payload.logger.warn(`[seed] corto "${corto.title}": ${describeError(err)}`)
    }
  }
  payload.logger.info(`[seed] ${externalIds.length}/${cortos.length} cortometrajes`)

  payload.logger.info(
    `[seed] Cargados ${catalogIds.length} reservables y ${externalIds.length} cortos`,
  )
}
