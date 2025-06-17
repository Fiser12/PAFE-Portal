'use server'

import configPromise from '@payload-config'
import { getPayload, Where } from 'payload'

interface GetUsersParams {
  searchTerm?: string
}

export async function getUsersBySearchTerm({ searchTerm }: GetUsersParams = {}) {
  try {
    const payload = await getPayload({ config: configPromise })

    const where: Where | undefined = searchTerm
      ? {
          or: [{ email: { contains: searchTerm } }, { name: { contains: searchTerm } }],
        }
      : undefined

    const users = await payload.find({
      collection: 'users',
      where,
      limit: 10,
      sort: 'email',
    })

    return users.docs
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    throw error
  }
}
