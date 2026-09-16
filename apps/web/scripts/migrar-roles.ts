/**
 * Pasa a `admin-catalogo` a quien tenga el rol `profesional`, que es el
 * anterior al reparto por áreas. Quien ya lleve un rol de área se deja como
 * está: el reparto fino lo decide una persona, no este script.
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm payload run scripts/migrar-roles.ts             # solo informa
 *   cd apps/web && APLICAR=1 pnpm payload run scripts/migrar-roles.ts
 *
 * Va por variable de entorno y no por flag porque `payload run` no le pasa
 * los argumentos al script: process.argv llega con node y bin.js y nada más.
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { ROLE_CATALOGO, ROLE_PROFESIONAL } from '../src/core/permissions'

const aplicar = process.env.APLICAR === '1'
const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'users',
  where: { role: { contains: ROLE_PROFESIONAL } },
  limit: 0,
  depth: 0,
  overrideAccess: true,
})

if (docs.length === 0) {
  console.log('No queda nadie con el rol profesional.')
  process.exit(0)
}

for (const user of docs) {
  const roles = (user.role ?? []).filter((r) => r !== ROLE_PROFESIONAL)
  const nuevos = roles.includes(ROLE_CATALOGO) ? roles : [...roles, ROLE_CATALOGO]

  console.log(`${aplicar ? '→' : '(simulación)'} ${user.email}: ${user.role} → ${nuevos}`)

  if (aplicar) {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { role: nuevos as typeof user.role },
      overrideAccess: true,
    })
  }
}

console.log(
  aplicar
    ? `${docs.length} persona(s) migradas.`
    : `${docs.length} persona(s) migrarían. Repite con APLICAR=1.`,
)
process.exit(0)
