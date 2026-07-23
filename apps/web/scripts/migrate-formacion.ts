/**
 * Carga (o actualiza, idempotente por slug) una Formación migrada desde Moodle.
 * El JSON de entrada lo produce el ETL (unidades con contenido Lexical).
 *
 * Uso:
 *   pnpm payload run scripts/migrate-formacion.ts [ruta.json]
 * Para cargar en PROD, exportar DATABASE_URL apuntando a Neon antes de ejecutar.
 */
import { readFileSync } from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import type { Formacione } from '../src/payload-types'

type FormacionInput = {
  title: string
  slug: string
  description?: string
  moodleCourseId?: number
  sections: NonNullable<Formacione['sections']>
}

const file = process.argv[2] || path.resolve(process.cwd(), 'scripts/_data/course9_formacion.json')
const data = JSON.parse(readFileSync(file, 'utf-8')) as FormacionInput

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'formaciones',
  where: { slug: { equals: data.slug } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})

const doc = {
  title: data.title,
  slug: data.slug,
  description: data.description,
  moodleCourseId: data.moodleCourseId,
  sections: data.sections,
}

const result = existing.docs[0]
  ? await payload.update({
      collection: 'formaciones',
      id: existing.docs[0].id,
      data: doc,
      overrideAccess: true,
    })
  : await payload.create({ collection: 'formaciones', data: doc, overrideAccess: true })

console.log(
  `✓ Formación ${existing.docs[0] ? 'actualizada' : 'creada'}: "${result.title}" (id ${result.id}, ${data.sections.length} unidades)`,
)
process.exit(0)
