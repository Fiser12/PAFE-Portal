'use server'

import { Case } from '@/payload-types'
import { isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

export async function getUserCases(userId: string) {
  try {
    const { payload, user: sessionUser } = await getSessionUser()

    if (!sessionUser || (String(userId) !== String(sessionUser.id) && !isStaff(sessionUser))) {
      throw new Error('No tienes permiso para ver estos casos')
    }

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 2,
    })

    // Solo devolver los casos del usuario
    const rawAssigned = user?.assignedCases as (Case | number)[] | undefined

    const userCases = rawAssigned
      ?.filter((caseItem): caseItem is Case => typeof caseItem === 'object' && caseItem !== null)
      .map((caseItem) => ({
        id: caseItem.id,
        title: caseItem.title,
        notes: caseItem.notes,
      })) || []

    return userCases
  } catch (error) {
    console.error('Error getting user cases:', error)
    throw error
  }
}