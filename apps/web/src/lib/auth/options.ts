import { nextCookies } from 'better-auth/next-js'
import type { PayloadAuthOptions } from 'payload-auth/better-auth'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import { getServerSideURL } from '@/utilities/getURL'

export const betterAuthPluginOptions: PayloadAuthOptions = {
  users: {
    slug: COLLECTION_SLUG_USER,
  },
  accounts: { slug: 'accounts' },
  sessions: { slug: 'sessions' },
  verifications: { slug: 'verifications' },

  betterAuthOptions: {
    secret: process.env.AUTH_SECRET,
    trustedOrigins: [getServerSideURL()],
    socialProviders: {
      google: {
        clientId: process.env.AUTH_CLIENT_ID as string,
        clientSecret: process.env.AUTH_CLIENT_SECRET as string,
      },
    },
    plugins: [nextCookies()],
  },
}
