import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET || !process.env.AUTH_SECRET) {
  throw new Error('Configura DATABASE_URL, PAYLOAD_SECRET y AUTH_SECRET antes de migrar')
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  const lock = await client.query(
    "SELECT pg_try_advisory_lock(hashtext('pafe:deployment:migrate')) AS acquired",
  )
  if (!lock.rows[0].acquired) throw new Error('Ya hay otra migración en ejecución')

  const table = await client.query("SELECT to_regclass('public.payload_migrations') AS name")
  if (table.rows[0].name) {
    const development = await client.query(
      "SELECT 1 FROM public.payload_migrations WHERE name = 'dev' OR batch = -1 LIMIT 1",
    )
    if (development.rowCount) {
      throw new Error(
        'La base contiene una marca dev. No se modifica: revisa el esquema y el respaldo antes de migrar.',
      )
    }
  }

  const result = spawnSync('pnpm', ['payload', 'migrate'], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PAYLOAD_DISABLE_PUSH: 'true',
      PAYLOAD_RUN_MIGRATIONS: 'false',
      SEED_MOCK_DATA: 'false',
      DISABLE_JOBS_AUTORUN: 'true',
      RESEND_API_KEY: '',
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  // Cerrar la conexión también libera el lock, incluso si falla Payload.
  await client.end()
}
