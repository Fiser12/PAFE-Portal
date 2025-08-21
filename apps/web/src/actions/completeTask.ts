'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function completeTask(taskId: number, userId: string) {
  try {
    const payload = await getPayload({ config: await configPromise })
    
    // Crear fecha a las 12:00 AM del día actual
    const completionDate = new Date()
    completionDate.setHours(0, 0, 0, 0) // Establecer a medianoche
    
    // Crear registro en tasks-completed
    const taskCompletion = await payload.create({
      collection: 'tasks-completed',
      data: {
        task: taskId,
        user: userId,
        completedOn: completionDate.toISOString(),
      },
    })

    return taskCompletion
  } catch (error) {
    console.error('Error completing task:', error)
    throw error
  }
}