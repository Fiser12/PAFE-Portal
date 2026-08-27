import { getPayload, type Payload } from 'payload'
import { buildTestConfig } from './test-config'

let memo: Promise<Payload> | undefined

/** Instancia única por proceso (los tests verticales corren en un solo fork) */
export const getTestPayload = (): Promise<Payload> =>
  (memo ??= getPayload({ config: buildTestConfig() }))
