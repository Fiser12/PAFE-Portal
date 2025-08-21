'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { TaskWithCaseInfo } from '@/types/cases'
import type { Task } from '@/payload-types'

export interface TaskCompletion {
  taskId: number
  userId: number
  completedOn: string
  id: number
}

export interface TaskWithCompletionInfo extends Omit<Task, 'completedOn'> {
  lastCompletion?: TaskCompletion | null
  caseInfo?: Array<{
    id: number
    title: string
    notes?: string | null
  }>
}

export async function getTasksWithCompletions(caseIds: number[]): Promise<TaskWithCompletionInfo[]> {
  try {
    const payload = await getPayload({ config: await configPromise })
    
    // Obtener tareas del caso
    const tasksResult = await payload.find({
      collection: 'tasks',
      where: {
        case: {
          in: caseIds
        }
      },
      depth: 2,
      limit: 1000
    })

    // Para cada tarea, obtener su última completación
    const tasksWithCompletions: TaskWithCompletionInfo[] = []
    
    for (const task of tasksResult.docs) {
      // Obtener la última completación de esta tarea
      const completionsResult = await payload.find({
        collection: 'tasks-completed',
        where: {
          task: {
            equals: task.id
          }
        },
        sort: '-completedOn',
        limit: 1
      })

      const lastCompletion = completionsResult.docs.length > 0 ? {
        taskId: task.id,
        userId: typeof completionsResult.docs[0].user === 'object' 
          ? completionsResult.docs[0].user.id 
          : completionsResult.docs[0].user,
        completedOn: completionsResult.docs[0].completedOn,
        id: completionsResult.docs[0].id
      } : null

      // Formatear información de casos
      const caseInfo = Array.isArray(task.case) 
        ? task.case.map(caseItem => {
            if (typeof caseItem === 'object') {
              return {
                id: caseItem.id,
                title: caseItem.title,
                notes: caseItem.notes
              }
            }
            return null
          }).filter(Boolean)
        : []

      tasksWithCompletions.push({
        ...task,
        lastCompletion,
        caseInfo
      })
    }

    return tasksWithCompletions
  } catch (error) {
    console.error('Error getting tasks with completions:', error)
    throw error
  }
}