import { execSync } from 'node:child_process'
import { TEST_DB } from './helpers/db'

const sh = (cmd: string) => execSync(cmd, { stdio: 'pipe' }).toString().trim()

const isRunning = () => {
  try {
    return sh(`docker inspect -f '{{.State.Running}}' ${TEST_DB.container}`) === 'true'
  } catch {
    return false
  }
}

export default function globalSetup() {
  if (!isRunning()) {
    try {
      sh(`docker rm -f ${TEST_DB.container}`)
    } catch {
      // no existía: nada que borrar
    }
    sh(
      `docker run -d --name ${TEST_DB.container} ` +
        `-e POSTGRES_USER=${TEST_DB.user} -e POSTGRES_PASSWORD=${TEST_DB.password} ` +
        `-e POSTGRES_DB=${TEST_DB.database} -p ${TEST_DB.port}:5432 postgres:17-alpine`,
    )
  }
  const deadline = Date.now() + 60_000
  for (;;) {
    try {
      sh(`docker exec ${TEST_DB.container} pg_isready -U ${TEST_DB.user} -d ${TEST_DB.database}`)
      break
    } catch {
      if (Date.now() > deadline) throw new Error(`${TEST_DB.container} no responde tras 60s`)
      execSync('sleep 1')
    }
  }
  // Esquema limpio en cada run: drizzle push lo reconstruye al arrancar Payload
  sh(
    `docker exec ${TEST_DB.container} psql -U ${TEST_DB.user} -d ${TEST_DB.database} ` +
      `-c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'`,
  )
}
