import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const [mode, directory, environment, confirmedHost] = process.argv.slice(2)
if (!['test', 'production'].includes(mode) || !directory)
  throw new Error('Usage: run.mjs test|production export-directory [production.env]')
if (mode === 'production' && !environment)
  throw new Error('Explicit production environment required')
const vars = mode === 'production' ? parseEnv(readFileSync(resolve(environment), 'utf8')) : {}
if (mode === 'production' && confirmedHost !== new URL(vars.DATABASE_URL).hostname)
  throw new Error('Pass the exact production hostname as the fourth argument')
const env = {
  ...process.env,
  ...vars,
  PAYLOAD_DISABLE_PUSH: 'true',
  PAYLOAD_RUN_MIGRATIONS: 'false',
  SEED_MOCK_DATA: 'false',
  DISABLE_JOBS_AUTORUN: 'true',
  RESEND_API_KEY: '',
  NODEBB_IMPORT_APPLY: 'true',
  NODEBB_IMPORT_DIR: resolve(directory),
  NODEBB_IMPORT_TEST: String(mode === 'test'),
  NODEBB_IMPORT_PRODUCTION: confirmedHost || '',
}
if (mode === 'test')
  env.TEST_DATABASE_URL = 'postgresql://pafe_test:pafe_test@test_db:5432/pafe_nodebb_import'
const result = spawnSync('pnpm', ['payload', 'run', 'scripts/nodebb/import.mjs'], {
  env,
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
