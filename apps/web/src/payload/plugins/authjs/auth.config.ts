import { NextAuthConfig } from 'next-auth'
import google from 'next-auth/providers/google'

export const SESSION_STRATEGY = 'jwt' as 'jwt' | 'database'
export const FIELDS_USER_IS_ALLOWED_TO_CHANGE = ['name']

export const authConfig: NextAuthConfig = {
  debug: true,
  trustHost: true,
  theme: { logo: 'https://authjs.dev/img/logo-sm.png' },
  secret: process.env.AUTH_SECRET,
  providers: [
    google({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      // NO usar issuer con Google OAuth
    }),
  ],
  session: {
    strategy: SESSION_STRATEGY,
  },
  callbacks: {
    async redirect(data) {
      return data.url
    },
  },
}
