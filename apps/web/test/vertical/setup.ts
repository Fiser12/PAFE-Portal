import { beforeEach } from 'vitest'
import { getTestPayload } from './helpers/payload'

/**
 * Aislamiento entre tests: `runDueReminders` barre TODAS las reservas activas,
 * así que un préstamo de un test anterior falsearía su recuento.
 */
beforeEach(async () => {
  const payload = await getTestPayload()
  await payload.delete({
    collection: 'reservation',
    where: { id: { greater_than: 0 } },
    overrideAccess: true,
  })
})
