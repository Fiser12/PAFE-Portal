import { Client } from 'pg'
import { TEST_DATABASE_URL } from './helpers/db'

const connect = async (): Promise<Client> => {
  const client = new Client({ connectionString: TEST_DATABASE_URL })
  await client.connect()
  return client
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function globalSetup() {
  const deadline = Date.now() + 60_000
  for (;;) {
    try {
      const client = await connect()
      // Esquema limpio en cada ejecución: drizzle push lo reconstruye al arrancar
      await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
      await client.end()
      return
    } catch (error) {
      if (Date.now() > deadline) {
        throw new Error(
          `No hay Postgres de test en ${TEST_DATABASE_URL}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
      await sleep(1000)
    }
  }
}
