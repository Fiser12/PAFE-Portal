import { RRule } from 'rrule'
import type { TaskWithCaseInfo, TaskWithNextDue, ClassifiedTasks, TaskStatus } from '@/types/cases'

/**
 * Calcula la próxima fecha de vencimiento para una tarea recurrente
 * @param rruleString - Regla RRule en formato RFC 5545
 * @param lastCompletedAt - Fecha de última completación
 * @returns Próxima fecha de vencimiento o null si no aplica
 */
export function getNextDueDate(rruleString: string, lastCompletedAt: Date): Date | null {
  if (!rruleString || !lastCompletedAt) return null
  
  try {
    const rule = RRule.fromString(rruleString)
    const nextOccurrence = rule.after(lastCompletedAt, true)
    return nextOccurrence
  } catch (error) {
    console.error('Error parsing RRule:', error)
    return null
  }
}

/**
 * Determina si una tarea recurrente debe completarse de nuevo
 * @param rruleString - Regla RRule en formato RFC 5545
 * @param lastCompletedAt - Fecha de última completación
 * @param now - Fecha actual (opcional, por defecto Date.now())
 * @returns true si la tarea debe completarse de nuevo
 */
export function shouldTaskBeCompletedAgain(
  rruleString: string | null | undefined,
  lastCompletedAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!rruleString || !lastCompletedAt) return false
  
  const lastCompleted = new Date(lastCompletedAt)
  const nextDue = getNextDueDate(rruleString, lastCompleted)
  
  return nextDue ? now >= nextDue : false
}

/**
 * Obtiene el estado de una tarea (completed, overdue, pending)
 * @param completedOn - Fecha de completación
 * @param rruleString - Regla RRule
 * @param now - Fecha actual
 * @returns Estado de la tarea
 */
export function getTaskStatus(
  completedOn: string | null | undefined,
  rruleString: string | null | undefined,
  now: Date = new Date()
): TaskStatus {
  // Si no está completada nunca, está pendiente
  if (!completedOn) return 'pending'
  
  // Si no es recurrente y está completada, está completada
  if (!rruleString) return 'completed'
  
  // Si es recurrente, verificar si debe completarse de nuevo
  if (shouldTaskBeCompletedAgain(rruleString, completedOn, now)) {
    return 'overdue'
  }
  
  return 'completed'
}

/**
 * Convierte una regla RRule simple a texto legible en español
 * @param rruleString - Regla RRule en formato RFC 5545
 * @returns Descripción legible de la recurrencia en español
 */
export function rruleToText(rruleString: string): string {
  if (!rruleString) return ''
  
  try {
    const rule = RRule.fromString(rruleString)
    const englishText = rule.toText()
    
    return englishText
      .replace(/every day/gi, 'todos los días')
      .replace(/every week/gi, 'cada semana')  
      .replace(/every month/gi, 'cada mes')
      .replace(/every year/gi, 'cada año')
      .replace(/every (\d+) days/gi, 'cada $1 días')
      .replace(/every (\d+) weeks/gi, 'cada $1 semanas')
      .replace(/every (\d+) months/gi, 'cada $1 meses')
      .replace(/every (\d+) years/gi, 'cada $1 años')
      .replace(/daily/gi, 'diariamente')
      .replace(/weekly/gi, 'semanalmente')
      .replace(/monthly/gi, 'mensualmente')
      .replace(/yearly/gi, 'anualmente')
      // Días de la semana
      .replace(/Monday/gi, 'lunes')
      .replace(/Tuesday/gi, 'martes')
      .replace(/Wednesday/gi, 'miércoles')
      .replace(/Thursday/gi, 'jueves')
      .replace(/Friday/gi, 'viernes')
      .replace(/Saturday/gi, 'sábado')
      .replace(/Sunday/gi, 'domingo')
      // Meses
      .replace(/January/gi, 'enero')
      .replace(/February/gi, 'febrero')
      .replace(/March/gi, 'marzo')
      .replace(/April/gi, 'abril')
      .replace(/May/gi, 'mayo')
      .replace(/June/gi, 'junio')
      .replace(/July/gi, 'julio')
      .replace(/August/gi, 'agosto')
      .replace(/September/gi, 'septiembre')
      .replace(/October/gi, 'octubre')
      .replace(/November/gi, 'noviembre')
      .replace(/December/gi, 'diciembre')
      // Preposiciones y conectores
      .replace(/on /gi, 'los ')
      .replace(/until/gi, 'hasta')
      .replace(/and/gi, 'y')
      .replace(/at/gi, 'a las')
  } catch (error) {
    console.error('Error parsing RRule:', error)
    return rruleString
  }
}


/**
 * Clasifica las tareas en pendientes y próximas
 * @param tasks - Array de tareas con información del caso
 * @returns Objeto con tareas pendientes y próximas organizadas
 */
export function classifyTasks(tasks: TaskWithCaseInfo[]): ClassifiedTasks {
  const now = new Date()
  const pendingTasks: TaskWithCaseInfo[] = []
  const upcomingTasks: TaskWithNextDue[] = []

  tasks.forEach(task => {
    const status = getTaskStatus(task.completedOn, task.rrule, now)
    
    if (status === 'pending' || status === 'overdue') {
      pendingTasks.push(task)
    } else if (status === 'completed' && task.rrule && task.completedOn) {
      // Para tareas recurrentes completadas, calcular próxima fecha
      const nextDue = getNextDueDate(task.rrule, new Date(task.completedOn))
      if (nextDue) {
        upcomingTasks.push({
          ...task,
          nextDueDate: nextDue
        })
      }
    }
  })

  // Ordenar tareas próximas por fecha de vencimiento
  upcomingTasks.sort((a, b) => {
    return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
  })

  return {
    pending: pendingTasks,
    upcoming: upcomingTasks
  }
}