'use server'

import { isActiveUser, isStaff } from '@/core/permissions'
import { getSessionUser } from '@/utilities/getSessionUser'

export async function completeTask(taskId: number, userId: string) {
  try {
    const { payload, user } = await getSessionUser()

    if (!user || !isActiveUser(user)) {
      throw new Error('No tienes permiso para completar tareas')
    }

    // Completar una tarea en nombre de otro usuario es cosa del staff
    if (String(userId) !== String(user.id) && !isStaff(user)) {
      throw new Error('No tienes permiso para completar tareas de otro usuario')
    }

    // Crear fecha a las 12:00 AM del día actual
    const completionDate = new Date()
    completionDate.setHours(0, 0, 0, 0) // Establecer a medianoche

    // Crear registro en tasks-completed
    const taskCompletion = await payload.create({
      collection: 'tasks-completed',
      data: {
        task: taskId,
        user: Number(userId),
        completedOn: completionDate.toISOString(),
      },
    })

    return taskCompletion
  } catch (error) {
    console.error('Error completing task:', error)
    throw error
  }
}
