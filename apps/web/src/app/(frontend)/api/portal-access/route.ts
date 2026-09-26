import { getSessionUser } from '@/utilities/getSessionUser'
import { esEquipoTecnico } from '@/core/technical-access'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { payload, user } = await getSessionUser()
  return Response.json(
    { tecnico: await esEquipoTecnico(payload, user) },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
  )
}
