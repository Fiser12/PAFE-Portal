'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Case } from '@/payload-types'

export async function getUserCases(userId: string) {
  try {
    const payload = await getPayload({ config: await configPromise })
    
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 2,
    })

    // Solo devolver los casos del usuario
    const userCases = user.assignedCases?.cast<Case>()?.filter((caseItem) => 
      typeof caseItem === 'object'
    ).map((caseItem) => ({
      id: caseItem.id,
      title: caseItem.title,
      notes: caseItem.notes
    })) || []

    return userCases
  } catch (error) {
    console.error('Error getting user cases:', error)
    throw error
  }
}