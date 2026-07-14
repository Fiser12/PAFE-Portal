// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { es } from '@payloadcms/translations/languages/es'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { collections } from './payload/collections'
import { Users } from './payload/collections/Users'
import { Footer } from './payload/admin_components/Footer/config'
import { Header } from './payload/admin_components/Header/config'
import { plugins } from './payload/plugins'
import { defaultLexical } from '@/payload/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { migrations } from './migrations'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Panel de admin íntegramente en español (traducciones oficiales de Payload)
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/legacy/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/legacy/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  // Email transaccional vía Resend cuando hay API key; sin ella (dev),
  // Payload escribe los correos en la consola.
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          apiKey: process.env.RESEND_API_KEY,
          defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          defaultFromName: process.env.EMAIL_FROM_NAME || 'PAFE',
        }),
      }
    : {}),
  db: postgresAdapter({
    prodMigrations: migrations,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  collections,
  upload: {
    limits: {
      // Tamaño máximo de cualquier subida (Media y Ficheros): 25 MB
      fileSize: 25 * 1024 * 1024,
    },
  },
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: plugins,
  secret: process.env.PAYLOAD_SECRET,
  // Carga datos de prueba al arrancar solo si SEED_MOCK_DATA=true (dev).
  // Es idempotente: no re-siembra si ya existe el admin de prueba.
  onInit: async (payload) => {
    if (process.env.SEED_MOCK_DATA === 'true') {
      const { seedMockData } = await import('./seed')
      // Sin await: el seed puebla en segundo plano y no bloquea el arranque
      void seedMockData(payload).catch((err) => {
        const e = err as { message?: string; data?: { errors?: unknown[] }; stack?: string }
        const detail = e?.data?.errors ? ` — ${JSON.stringify(e.data.errors)}` : ''
        payload.logger.error(`[seed] error: ${e?.message ?? String(err)}${detail}`)
        if (e?.stack) payload.logger.error(e.stack)
      })
    }
  },
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
