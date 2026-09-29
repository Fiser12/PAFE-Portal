import { getPayloadAuth } from 'payload-auth/better-auth'
import { getPayload, type Payload } from 'payload'
import { buildTestConfig } from './test-config'

let memo: Promise<Payload> | undefined

/** Instancia única por proceso (los tests verticales corren en un solo fork) */
export const getTestPayload = (): Promise<Payload> =>
  (memo ??= getPayload({ config: buildTestConfig() }))

/** La misma instancia, con el better-auth que monta payload-auth a la vista */
export const getTestAuth = async () =>
  (await getTestPayload()) as Awaited<ReturnType<typeof getPayloadAuth>>
