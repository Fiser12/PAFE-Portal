import { toNextJsHandler } from 'better-auth/next-js'
import { getPayloadAuth } from 'payload-auth/better-auth'
import payloadConfig from '@payload-config'

const payload = await getPayloadAuth(payloadConfig)

export const { GET, POST } = toNextJsHandler(payload.betterAuth)
