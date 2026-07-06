import { betterAuthPlugin } from 'payload-auth/better-auth'
import { betterAuthPluginOptions } from '@/lib/auth/options'

export const betterAuthPluginInstance = betterAuthPlugin(betterAuthPluginOptions)
