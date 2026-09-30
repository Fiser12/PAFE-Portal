import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { InvitacionRuleError } from '../domain/errors'
import {
  correoDeInvitacion,
  esRolInvitable,
  leerCorreos,
  puedeInvitar,
  urlDeInvitacion,
} from '../domain/invitacion'

export type EstadoDeInvitacion = 'enviada' | 'ya-tiene-cuenta' | 'correo-no-valido' | 'error'

export interface ResultadoDeInvitacion {
  email: string
  estado: EstadoDeInvitacion
  url?: string
  mensaje?: string
}

const INVITACIONES = 'admin-invitations'

const tieneCuenta = async (payload: Payload, email: string) => {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { like: email } },
    depth: 0,
    limit: 10,
    overrideAccess: true,
  })
  return docs.some((user) => user.email.toLowerCase() === email)
}

const invitarA = async (
  payload: Payload,
  email: string,
  rol: Parameters<typeof esRolInvitable>[0],
): Promise<ResultadoDeInvitacion> => {
  if (!esRolInvitable(rol)) throw new InvitacionRuleError('sin-permiso')
  if (await tieneCuenta(payload, email)) return { email, estado: 'ya-tiene-cuenta' }

  await payload.delete({
    collection: INVITACIONES,
    where: { email: { equals: email } },
    overrideAccess: true,
  })
  const token = randomUUID()
  const url = urlDeInvitacion(getServerSideURL(), token)
  const invitacion = await payload.create({
    collection: INVITACIONES,
    data: { token, role: rol, email },
    overrideAccess: true,
  })

  try {
    await payload.sendEmail({ to: email, ...correoDeInvitacion(url) })
    return { email, estado: 'enviada', url }
  } catch (error) {
    // Una invitación que no ha llegado no debe figurar como pendiente
    await payload.delete({ collection: INVITACIONES, id: invitacion.id, overrideAccess: true })
    return { email, estado: 'error', mensaje: error instanceof Error ? error.message : undefined }
  }
}

/** Una invitación, con su propio enlace, por cada correo de la lista */
export const invitarPersonas = async ({
  payload,
  user,
  texto,
  rol,
}: {
  payload: Payload
  user: User | null
  texto: string
  rol: string
}): Promise<ResultadoDeInvitacion[]> => {
  if (!puedeInvitar(user, rol)) throw new InvitacionRuleError('sin-permiso')

  const { validos, invalidos } = leerCorreos(texto)
  const resultados: ResultadoDeInvitacion[] = []
  for (const email of validos) resultados.push(await invitarA(payload, email, rol))
  return [
    ...resultados,
    ...invalidos.map((email): ResultadoDeInvitacion => ({ email, estado: 'correo-no-valido' })),
  ]
}
