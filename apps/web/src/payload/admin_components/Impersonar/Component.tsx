import type { UIFieldServerComponent } from 'payload'
import { puedeImpersonarA } from '@/core/permissions'
import { BotonImpersonar } from './Boton'

/**
 * Se decide en el servidor: el navegador no sabe quién es el superadmin. El
 * endpoint lo vuelve a comprobar.
 */
export const ImpersonarField: UIFieldServerComponent = ({ id, data, req }) => {
  if (!id || String(req.user?.id) === String(id)) return null
  if (!puedeImpersonarA(req.user, { email: data?.email, role: data?.role })) return null
  return <BotonImpersonar id={id} />
}
