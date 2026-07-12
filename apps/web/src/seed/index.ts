import fs from 'fs'
import path from 'path'
import { hashPassword } from 'better-auth/crypto'
import type { Payload } from 'payload'
import { ROLE_ADMIN, ROLE_PROFESIONAL, ROLE_FAMILIA } from '@/core/permissions'

const PASSWORD = 'test1234!'
const ASSETS = path.join(process.cwd(), 'src/seed/assets')

const TEMAS = [
  'comunicación',
  'lectura fácil',
  'emociones',
  'autonomía personal',
  'habilidades sociales',
  'pictogramas',
  'atención y memoria',
  'matemáticas básicas',
  'vida diaria',
  'juego simbólico',
  'motricidad',
  'lenguaje',
]

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

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

const richText = (text: string) => ({
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] },
    ],
    direction: null,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

// Genera `count` títulos únicos combinando prefijos, temas y un sufijo opcional
function uniqueTitles(prefixes: string[], count: number, suffix = ''): string[] {
  const out = new Set<string>()
  let nivel = 0
  while (out.size < count) {
    for (const p of prefixes) {
      for (const t of TEMAS) {
        const extra = nivel > 0 ? ` (nivel ${nivel})` : ''
        out.add(`${p} ${t}${suffix}${extra}`)
        if (out.size >= count) break
      }
      if (out.size >= count) break
    }
    nivel++
  }
  return [...out].slice(0, count)
}

export async function seedMockData(payload: Payload): Promise<void> {
  const now = new Date().toISOString()

  // --- Usuarios con credenciales (PRIMERO, para poder entrar ya) ------------
  // hashPassword de better-auth/crypto: mismo algoritmo que usa el login,
  // y disponible en onInit (payload.betterAuth aún no lo está).
  const passwordHash = await hashPassword(PASSWORD)

  const createUser = async (email: string, name: string, role: string[]): Promise<number> => {
    const ex = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    })
    if (ex.totalDocs > 0) return ex.docs[0]!.id as number
    const user = await payload.create({
      collection: 'users',
      data: { email, name, role, emailVerified: true } as never,
    })
    await payload.create({
      collection: 'accounts',
      data: {
        accountId: String(user.id),
        providerId: 'credential',
        user: user.id,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      } as never,
    })
    return user.id as number
  }

  await createUser('admin@test.local', 'Admin Prueba', [ROLE_ADMIN])
  await createUser('prof@test.local', 'Profesional Prueba', [ROLE_PROFESIONAL])
  const familiaId = await createUser('familia@test.local', 'Familia Prueba', [ROLE_FAMILIA])
  await createUser('sinrol@test.local', 'Sin Rol Prueba', [])
  payload.logger.info(`[seed] usuarios de prueba listos (contraseña: ${PASSWORD})`)

  // Si el catálogo ya está poblado, no re-sembrar el resto
  const catCount = await payload.count({ collection: 'catalog-item' })
  if (catCount.totalDocs >= 50) return
  payload.logger.info('[seed] poblando catálogo…')

  // --- Categorías -----------------------------------------------------------
  const categoryNames = [
    'Comunicación',
    'Autonomía',
    'Ocio y juego',
    'Habilidades sociales',
    'Tecnología',
    'Aprendizaje',
    'Familia',
    'Terapia',
  ]
  const categories: number[] = []
  for (const name of categoryNames) {
    const slug = slugify(name)
    try {
      categories.push(await upsert(payload, 'taxonomy', { slug }, { name, slug }))
    } catch (err) {
      payload.logger.error(`[seed] categoría "${name}": ${describeError(err)}`)
    }
  }
  const catFor = (i: number): number[] => [
    categories[i % categories.length]!,
    categories[(i + 3) % categories.length]!,
  ]

  // --- Pool de portadas (subir las imágenes de stock a media una vez) --------
  const coverPool: Record<string, number[]> = {}
  const themes = ['book', 'toy', 'education', 'document', 'video', 'computer']
  for (const theme of themes) {
    coverPool[theme] = []
    for (let n = 1; n <= 5; n++) {
      const alt = `${theme} ${n}`
      try {
        // Idempotente: el filename de media es determinista (hook content-hash),
        // así que reutilizamos la portada ya subida en vez de re-subirla.
        const found = await payload.find({
          collection: 'media',
          where: { alt: { equals: alt } },
          limit: 1,
        })
        if (found.totalDocs > 0) {
          coverPool[theme].push(found.docs[0]!.id as number)
          continue
        }
        const file = fs.readFileSync(path.join(ASSETS, 'covers', `${theme}-${n}.jpg`))
        const media = await payload.create({
          collection: 'media',
          data: { alt },
          file: { data: file, mimetype: 'image/jpeg', name: `${theme}-${n}.jpg`, size: file.length },
        })
        coverPool[theme].push(media.id as number)
      } catch (err) {
        payload.logger.warn(`[seed] portada ${theme}-${n}: ${describeError(err)}`)
      }
    }
  }
  payload.logger.info(`[seed] portadas subidas (${Object.values(coverPool).flat().length})`)
  const coverFrom = (theme: string, i: number): number | null => {
    const pool = coverPool[theme]
    return pool && pool.length > 0 ? pool[i % pool.length]! : null
  }

  // --- Grupos (name es único → upsert) --------------------------------------
  const grupoId = await upsert(payload, 'groups', { name: 'Grupo A' }, {
    name: 'Grupo A',
    description: 'Grupo de prueba',
  })
  await upsert(payload, 'groups', { name: 'Grupo B' }, {
    name: 'Grupo B',
    description: 'Segundo grupo de prueba',
  })

  // --- Catálogo reservable (~50) --------------------------------------------
  const reservableSpecs: { titles: string[]; type: string; theme: string }[] = [
    { titles: uniqueTitles(['Cuaderno de', 'Guía de', 'Manual de', 'Libro de'], 20), type: 'libro', theme: 'book' },
    { titles: uniqueTitles(['Juego de', 'Dominó de', 'Puzzle de', 'Memory de'], 18), type: 'juego', theme: 'toy' },
    { titles: uniqueTitles(['Programa de', 'Plan de', 'Taller de'], 12), type: 'programa', theme: 'education' },
  ]
  const catalogIds: number[] = []
  let ci = 0
  for (const spec of reservableSpecs) {
    for (const title of spec.titles) {
      try {
        const item = await payload.create({
          collection: 'catalog-item',
          data: {
            title,
            type: spec.type,
            quantity: (ci % 5) + 1,
            cover: coverFrom(spec.theme, ci),
            content: richText(`Material reservable de prueba: ${title}.`),
            categories: catFor(ci),
          } as never,
        })
        catalogIds.push(item.id as number)
      } catch (err) {
        payload.logger.warn(`[seed] reservable "${title}": ${describeError(err)}`)
      }
      ci++
    }
  }
  payload.logger.info(`[seed] ${catalogIds.length} reservables creados`)

  // --- Materiales descargables (~30) ----------------------------------------
  const downloadTitles = uniqueTitles(['Guía', 'Manual', 'Ficha', 'Cuaderno', 'Protocolo'], 30)
  const pdfBuffers = Array.from({ length: 10 }, (_, i) =>
    fs.readFileSync(path.join(ASSETS, 'files', `doc-${i + 1}.pdf`)),
  )
  for (let i = 0; i < downloadTitles.length; i++) {
    const pdf = pdfBuffers[i % pdfBuffers.length]!
    try {
      await payload.create({
        collection: 'files',
        data: { title: downloadTitles[i], cover: coverFrom('document', i), categories: catFor(i) } as never,
        file: {
          data: pdf,
          mimetype: 'application/pdf',
          name: `descargable-${i + 1}.pdf`,
          size: pdf.length,
        },
      })
    } catch (err) {
      payload.logger.warn(`[seed] descargable ${i}: ${describeError(err)}`)
    }
  }

  // --- Recursos externos (~20) ----------------------------------------------
  const externalSpecs: { titles: string[]; type: string; theme: string; url: string }[] = [
    { titles: uniqueTitles(['Vídeo:'], 8), type: 'video', theme: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { titles: uniqueTitles(['Portal de', 'Web de'], 5), type: 'web_link', theme: 'computer', url: 'https://arasaac.org' },
    { titles: uniqueTitles(['Cuestionario de'], 4), type: 'google-form', theme: 'computer', url: 'https://forms.gle/ejemplo' },
    { titles: uniqueTitles(['Documento de'], 3), type: 'google-doc', theme: 'document', url: 'https://docs.google.com/document/d/ejemplo' },
  ]
  const externalIds: number[] = []
  let ei = 0
  for (const spec of externalSpecs) {
    for (const title of spec.titles) {
      try {
        const res = await payload.create({
          collection: 'external-resources',
          data: {
            title,
            type: spec.type,
            url: spec.url,
            description: `Recurso externo de prueba: ${title}.`,
            cover: coverFrom(spec.theme, ei),
            categories: catFor(ei),
          } as never,
        })
        externalIds.push(res.id as number)
      } catch (err) {
        payload.logger.warn(`[seed] externo "${title}": ${describeError(err)}`)
      }
      ei++
    }
  }

  // --- Caso, tareas y completación ------------------------------------------
  const caseDoc = await payload.create({
    collection: 'cases',
    data: { title: 'Caso de seguimiento — Familia Prueba', notes: 'Caso de ejemplo.' } as never,
  })
  await payload.update({
    collection: 'users',
    id: familiaId,
    data: { assignedCases: [caseDoc.id], groups: [grupoId] } as never,
  })

  const task1 = await payload.create({
    collection: 'tasks',
    data: {
      title: 'Completar cuestionario inicial',
      case: [caseDoc.id],
      rrule: { rrule: 'FREQ=WEEKLY;INTERVAL=1', datePickerInitialDate: now },
      resources: externalIds[8] ? [{ relationTo: 'external-resources', value: externalIds[8] }] : [],
    } as never,
  })
  await payload.create({
    collection: 'tasks',
    data: {
      title: 'Ver vídeo de rutinas',
      case: [caseDoc.id],
      rrule: { rrule: 'FREQ=DAILY;INTERVAL=1', datePickerInitialDate: now },
      resources: externalIds[0] ? [{ relationTo: 'external-resources', value: externalIds[0] }] : [],
    } as never,
  })

  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  await payload.create({
    collection: 'tasks-completed',
    data: { task: task1.id, user: familiaId, completedOn: midnight.toISOString() } as never,
  })

  // --- Reservas de la familia -----------------------------------------------
  for (const itemId of catalogIds.slice(0, 3)) {
    await payload.create({
      collection: 'reservation',
      data: { item: itemId, user: familiaId, reservationDate: now } as never,
    })
  }

  payload.logger.info(
    `[seed] Cargados ${catalogIds.length} reservables, ${downloadTitles.length} descargables, ${externalIds.length} externos. Contraseña: ${PASSWORD}`,
  )
}
