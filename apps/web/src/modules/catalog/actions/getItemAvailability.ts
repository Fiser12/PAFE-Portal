'use server'

import { getSessionUser } from '@/utilities/getSessionUser'
import { esEquipoTecnico } from '@/core/technical-access'
import { LoanRuleError } from '../domain/errors'
import { getAvailability } from '../services'

export async function getItemAvailability(itemId: number) {
  const { payload, user } = await getSessionUser()
  if (!(await esEquipoTecnico(payload, user))) throw new LoanRuleError('sin-permiso')
  const { total, available } = await getAvailability({ payload, itemId })

  return { available, total, reserved: total - available }
}
