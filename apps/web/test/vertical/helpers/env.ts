import { TEST_DATABASE_URL } from './db'

// drizzle push solo sincroniza el esquema fuera de production
process.env.NODE_ENV = 'development'
process.env.PAYLOAD_SECRET ||= 'test-payload-secret'
process.env.BETTER_AUTH_SECRET ||= 'test-better-auth-secret'
process.env.AUTH_CLIENT_ID ||= 'test-google-client-id'
process.env.AUTH_CLIENT_SECRET ||= 'test-google-client-secret'
process.env.NEXT_PUBLIC_SERVER_URL ||= 'http://localhost:3000'
process.env.DATABASE_URL = TEST_DATABASE_URL
