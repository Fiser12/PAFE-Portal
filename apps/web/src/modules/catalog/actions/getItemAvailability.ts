'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getAvailability } from '../services'

export async function getItemAvailability(itemId: number) {
  const payload = await getPayload({ config: await configPromise })
  const { total, available } = await getAvailability({ payload, itemId })

  return { available, total, reserved: total - available }
}
