/**
 * Crea las áreas del tablón, que son términos de taxonomía con la faceta
 * `area`. Sin ellas no hay dónde publicar, y por el panel habría que escribir
 * el JSON de la faceta a mano en cada una.
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm payload run scripts/crear-areas.ts "Avisos generales" "Formación"
 *
 * Repetirlo es inocuo: un área que ya existe se deja como está.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const slugDe = (nombre: string): string =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const nombres = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))

if (nombres.length === 0) {
  console.error('Uso: pnpm payload run scripts/crear-areas.ts "Área uno" "Área dos"')
  process.exit(1)
}

const payload = await getPayload({ config })

for (const name of nombres) {
  const slug = slugDe(name)
  const existente = await payload.find({
    collection: 'taxonomy',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (existente.docs.length > 0) {
    console.log(`= ${name} (${slug}) ya existía`)
    continue
  }

  await payload.create({
    collection: 'taxonomy',
    data: { name, slug, payload: { types: ['area'] } },
    overrideAccess: true,
  })
  console.log(`+ ${name} (${slug})`)
}

process.exit(0)
