import type { CollectionAfterChangeHook } from 'payload'
import type { Task } from '@/payload-types'

/**
 * Avisa a las familias del caso cuando se les asigna una tarea. Va en un hook
 * porque el staff las crea desde el panel, y por ahí no pasa ningún servicio.
 */
export const avisarAlAsignar: CollectionAfterChangeHook<Task> = async ({ doc, req }) => {
  const { avisarDeTareaAsignada } = await import('../services')
  try {
    await avisarDeTareaAsignada({ payload: req.payload, tarea: doc, req })
  } catch (error) {
    // La tarea se guarda igual: perder lo que el staff acaba de asignar es peor
    req.payload.logger.error(
      `[tareas] la tarea ${doc.id} se guardó, pero el aviso falló: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
  return doc
}
