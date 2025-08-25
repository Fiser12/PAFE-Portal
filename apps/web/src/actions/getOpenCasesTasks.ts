'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import "@nexo-labs/hegel"
import { Case } from '@/payload-types'

export async function getOpenCasesTasks(userId: string, caseId?: string) {
  try {
    const payload = await getPayload({ config: await configPromise })
    
    // Primero obtenemos el usuario con sus casos asignados
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 2,
    })

    // Obtenemos todos los casos del usuario (ya no hay status que filtrar)
    let userCases = user.assignedCases?.cast<Case>()?.filter((caseItem) => 
      typeof caseItem === 'object'
    ) || []

    // Si se especifica un caso específico, filtrar solo por ese caso
    if (caseId) {
      userCases = userCases.filter((caseItem) => caseItem.id.toString() === caseId)
    }

    // Obtenemos todas las tareas que pertenecen a estos casos
    const caseIds = userCases.map((caseItem) => caseItem.id)
    
    const tasks = await payload.find({
      collection: 'tasks',
      where: {
        case: {
          in: caseIds,
        },
      },
      depth: 3, // Para obtener casos, recursos y sus relaciones
    })

    // Obtener TODAS las completaciones del usuario de una vez
    const taskIds = tasks.docs.map(task => task.id)
    const allCompletions = await payload.find({
      collection: 'tasks-completed',
      where: {
        and: [
          {
            task: {
              in: taskIds
            }
          },
          {
            user: {
              equals: userId
            }
          }
        ]
      },
      sort: '-completedOn',
      limit: 1000 // Ajustar según necesidad
    })

    // Crear mapa de última completación por tarea
    const completionsByTask = new Map()
    allCompletions.docs.forEach(completion => {
      const taskId = typeof completion.task === 'object' ? completion.task.id : completion.task
      if (!completionsByTask.has(taskId)) {
        completionsByTask.set(taskId, {
          taskId,
          userId: typeof completion.user === 'object' ? completion.user.id : completion.user,
          completedOn: completion.completedOn,
          id: completion.id
        })
      }
    })

    // Enriquecemos las tareas con información de casos y completaciones
    const allTasks = tasks.docs.map((task) => {
      // Como una tarea puede estar en múltiples casos, obtenemos todos los casos del usuario
      const taskCases = Array.isArray(task.case) ? task.case : [task.case]
      const userRelevantCases = taskCases.cast<Case>().filter((caseRef) => 
        caseIds.includes(caseRef.id)
      )
      
      const caseInfo = userRelevantCases.map((caseRef) => {
        if (typeof caseRef === 'object') {
          return {
            id: caseRef.id,
            title: caseRef.title,
            notes: caseRef.notes
          }
        } else {
          // Es un ID, buscar en userCases
          const foundCase = userCases.cast<Case>().find((c) => c.id === caseRef)
          if (foundCase && typeof foundCase === 'object') {
            return {
              id: foundCase.id,
              title: foundCase.title,
              notes: foundCase.notes
            }
          }
          return null
        }
      }).filter((caseInfo): caseInfo is NonNullable<typeof caseInfo> => caseInfo !== null)

      // Obtener completación desde el mapa
      const lastCompletion = completionsByTask.get(task.id) || null

      return {
        ...task,
        caseInfo,
        lastCompletion
      }
    })

    return {
      docs: allTasks,
      totalDocs: allTasks.length,
      limit: allTasks.length,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    }
  } catch (error) {
    console.error('Error getting open cases tasks:', error)
    throw error
  }
}

