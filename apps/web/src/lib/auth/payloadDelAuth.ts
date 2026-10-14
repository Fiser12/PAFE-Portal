import type { Payload } from 'payload'

let registrada: Payload | undefined

/** El arnés de tests monta su propio Payload: lo registra aquí para que los correos de auth salgan por él */
export const registrarPayloadDelAuth = (payload: Payload) => {
  registrada = payload
}

/**
 * Imports dinámicos para no crear un ciclo: options.ts forma parte del
 * payload.config y cuando se pide, payload ya está inicializado.
 */
export const payloadDelAuth = async (): Promise<Payload> => {
  if (registrada) return registrada
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  return getPayload({ config })
}
