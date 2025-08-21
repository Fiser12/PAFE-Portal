'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function completeTask(taskId: number) {
  try {
    const payload = await getPayload({ config: await configPromise })
    
    // Crear fecha a las 12:00 AM del día actual
    const completionDate = new Date()
    completionDate.setHours(0, 0, 0, 0) // Establecer a medianoche
    
    const updatedTask = await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        completedOn: completionDate.toISOString(),
      },
    })

    return updatedTask
  } catch (error) {
    console.error('Error completing task:', error)
    throw error
  }
}