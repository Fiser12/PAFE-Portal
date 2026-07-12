import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seedMockData } from '../src/seed'

// getPayload hace push del schema (dev). Llamamos al seed con await para
// verificar que completa. NO usar SEED_MOCK_DATA aquí (evita doble seed).
const payload = await getPayload({ config })
await seedMockData(payload)

const collections = [
  'catalog-item',
  'files',
  'external-resources',
  'media',
  'search',
  'users',
  'taxonomy',
  'cases',
  'tasks',
  'reservation',
]
const counts: Record<string, number> = {}
for (const c of collections) {
  const r = await payload.count({ collection: c as never })
  counts[c] = r.totalDocs
}
console.log('COUNTS', JSON.stringify(counts))
process.exit(0)
export {}
