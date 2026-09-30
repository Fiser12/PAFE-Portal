import { APIError, type CollectionBeforeDeleteHook, type PayloadRequest } from 'payload'
import { isLive } from '@/modules/catalog/domain/lifecycle'

const HISTORIAL = ['notification', 'reservation', 'tasks-completed', 'questionnaire-executions'] as const

const borrarSuHistorial = async (req: PayloadRequest, id: number | string) => {
  for (const collection of HISTORIAL) {
    await req.payload.delete({
      collection,
      where: { user: { equals: id } },
      req,
      overrideAccess: true,
    })
  }
}

/**
 * La base no deja borrar a alguien mientras quede algo suyo que lo exige: se
 * borra su historial antes. Un préstamo en curso sí lo impide, porque el
 * material aún tiene que volver.
 */
export const limpiarAntesDeBorrar: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { docs } = await req.payload.find({
    collection: 'reservation',
    where: { user: { equals: id } },
    depth: 0,
    pagination: false,
    req,
    overrideAccess: true,
  })
  if (docs.some((reserva) => isLive(reserva.status))) {
    throw new APIError(
      'Tiene préstamos en curso: devuélvelos o cancélalos antes de borrar la cuenta',
      409,
      undefined,
      true,
    )
  }
  await borrarSuHistorial(req, id)
}
