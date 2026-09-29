import type {
  CollectionAfterChangeHook,
  CollectionBeforeDeleteHook,
  PayloadRequest,
} from 'payload'
import { ROLE_IMPERSONAR, getUserRoles } from '@/core/permissions'

const cerrarLasDe = (req: PayloadRequest, id: number | string) =>
  req.payload.delete({
    collection: 'sessions',
    where: { impersonatedBy: { equals: id } },
    req,
    overrideAccess: true,
  })

/** Sin el rol, lo que ya estuviera haciendo como otra persona se acaba en el acto */
export const cerrarImpersonacionesAlPerderElRol: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const loTenia = getUserRoles(previousDoc).includes(ROLE_IMPERSONAR)
  if (operation === 'update' && loTenia && !getUserRoles(doc).includes(ROLE_IMPERSONAR)) {
    await cerrarLasDe(req, doc.id)
  }
  return doc
}

/** Antes de borrar: después, la base de datos ya habría dejado impersonatedBy a null */
export const cerrarImpersonacionesAlBorrar: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await cerrarLasDe(req, id)
}
