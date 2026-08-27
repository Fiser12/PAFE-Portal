import './env'
import sharp from 'sharp'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { collections } from '@/payload/collections'
import { defaultLexical } from '@/payload/fields/defaultLexical'
import { betterAuthPluginInstance } from '@/payload/plugins/better-auth'
import { plugin as searchPlugin } from '@/payload/plugins/search/plugin'
import { testEmailAdapter } from './email'
import { TEST_DATABASE_URL } from './db'

/**
 * Config de Payload para tests verticales: colecciones reales + better-auth
 * (inyecta `role` en users) y search (el bloque Recurso referencia su
 * colección) sobre un Postgres efímero, con email de captura. Sin plugins que
 * dependan de servicios externos (s3, seo, cloud).
 */
export const buildTestConfig = () =>
  buildConfig({
    secret: process.env.PAYLOAD_SECRET as string,
    collections,
    editor: defaultLexical,
    email: testEmailAdapter,
    plugins: [betterAuthPluginInstance, searchPlugin],
    sharp,
    db: postgresAdapter({
      push: true,
      pool: { connectionString: TEST_DATABASE_URL },
    }),
  })
