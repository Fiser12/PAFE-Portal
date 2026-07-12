/**
 * Crea usuarios de prueba (uno por rol) con credenciales email/contraseña
 * para verificar el sistema de permisos en desarrollo.
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm payload run scripts/seed-test-users.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

const PASSWORD = 'test1234!'

const TEST_USERS = [
  { email: 'admin@test.local', name: 'Admin Test', role: ['admin'] },
  { email: 'prof@test.local', name: 'Profesional Test', role: ['profesional'] },
  { email: 'familia@test.local', name: 'Familia Test', role: ['familia'] },
  // Sin rol = recién registrado con Google, pendiente de validar por el staff
  { email: 'sinrol@test.local', name: 'Sin Rol Test', role: [] },
] as const

const payload = await getPayload({ config })

async function run() {
  // payload.betterAuth lo añade payload-auth en runtime (sin tipos en BasePayload)
  const betterAuth = (payload as unknown as { betterAuth: { $context: Promise<any> } })
    .betterAuth
  const ctx = await betterAuth.$context
  const passwordHash = await ctx.password.hash(PASSWORD)

  const now = new Date().toISOString()

  for (const u of TEST_USERS) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: u.email } },
    })
    let userId = existing.docs[0]?.id
    if (userId === undefined) {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: u.email,
          name: u.name,
          role: [...u.role],
          emailVerified: true,
        } as never,
      })
      userId = user.id
      console.log(`+ creado ${u.email} con rol [${u.role.join(', ')}] (id ${userId})`)
    } else {
      // Asegura que el rol coincide con el esperado (idempotencia)
      await payload.update({
        collection: 'users',
        id: userId,
        data: { role: [...u.role] } as never,
      })
      console.log(`✓ ${u.email} ya existe (id ${userId}), rol asegurado [${u.role.join(', ')}]`)
    }

    // Cuenta de credenciales better-auth (provider 'credential')
    const account = await payload.find({
      collection: 'accounts',
      where: {
        and: [{ user: { equals: userId } }, { providerId: { equals: 'credential' } }],
      },
    })
    if (account.totalDocs === 0) {
      await payload.create({
        collection: 'accounts',
        data: {
          accountId: String(userId),
          providerId: 'credential',
          user: userId,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        } as never,
      })
      console.log(`  + credenciales creadas para ${u.email}`)
    }
  }
}

try {
  await run()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
