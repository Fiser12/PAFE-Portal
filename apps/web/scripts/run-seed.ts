/**
 * Ejecuta el seed completo (usuarios de prueba + catálogo real de PAFE)
 * sin necesidad de arrancar el dev server con SEED_MOCK_DATA=true.
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm payload run scripts/run-seed.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seedMockData } from '../src/seed'

const payload = await getPayload({ config })
await seedMockData(payload)
payload.logger.info('[seed] terminado')
process.exit(0)
