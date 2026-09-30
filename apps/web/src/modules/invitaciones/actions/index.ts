'use server'

import { getSessionUser } from '@/utilities/getSessionUser'
import { InvitacionRuleError, type InvitacionRuleCode } from '../domain/errors'
import { invitarPersonas, type ResultadoDeInvitacion } from '../services'

export type RespuestaDeInvitar =
  | { ok: true; resultados: ResultadoDeInvitacion[] }
  | { ok: false; error: InvitacionRuleCode }

export async function invitar(texto: string, rol: string): Promise<RespuestaDeInvitar> {
  const { payload, user } = await getSessionUser()
  try {
    return { ok: true, resultados: await invitarPersonas({ payload, user, texto, rol }) }
  } catch (error) {
    if (error instanceof InvitacionRuleError) return { ok: false, error: error.code }
    throw error
  }
}
