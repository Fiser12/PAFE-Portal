'use server'

import { Where } from 'payload'
import { isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

interface GetUsersParams {
  searchTerm?: string
}

export async function getUsersBySearchTerm({ searchTerm }: GetUsersParams = {}) {
  try {
    const { payload, user } = await getSessionUser()

    if (!isStaff(user)) {
      throw new Error('No tienes permiso para buscar usuarios')
    }

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
