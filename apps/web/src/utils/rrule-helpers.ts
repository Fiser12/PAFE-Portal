import { RRule } from 'rrule'
import type { TaskWithCaseInfo, TaskWithNextDue, ClassifiedTasks, TaskStatus } from '@/types/cases'
import type { RRuleValue } from '@/types/rrule'

/**
 * Calcula la próxima fecha de vencimiento para una tarea recurrente
 * @param rruleString - Regla RRule en formato RFC 5545
 * @param lastCompletedAt - Fecha de última completación
 * @returns Próxima fecha de vencimiento o null si no aplica
 */
export function getNextDueDate(rruleValue: RRuleValue | null | undefined, lastCompletedAt: Date): Date | null {
  if (!rruleValue?.rrule || !lastCompletedAt) return null
  
  try {
    const rule = RRule.fromString(rruleValue.rrule)
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
  rruleValue: RRuleValue | null | undefined,
  lastCompletedAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!rruleValue || !lastCompletedAt) return false
  
  const lastCompleted = new Date(lastCompletedAt)
  const nextDue = getNextDueDate(rruleValue, lastCompleted)
  
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
  rruleValue: RRuleValue | null | undefined,
  now: Date = new Date()
): TaskStatus {
  // Si no está completada nunca, está pendiente
  if (!completedOn) return 'pending'
  
  // Si no es recurrente y está completada, está completada
  if (!rruleValue) return 'completed'
  
  // Si es recurrente, verificar si debe completarse de nuevo
  if (shouldTaskBeCompletedAgain(rruleValue, completedOn, now)) {
    return 'overdue'
  }
  
  return 'completed'
}

/**
 * Convierte una regla RRule simple a texto legible en español
 * @param rruleString - Regla RRule en formato RFC 5545
 * @returns Descripción legible de la recurrencia en español
 */
export function rruleToText(rruleValue: RRuleValue | null | undefined): string {
  if (!rruleValue?.rrule) return ''
  
  try {
    const rule = RRule.fromString(rruleValue.rrule)
    const englishText = rule.toText()
    
    return englishText
      .replace(/every day/gi, 'todos los días')
      .replace(/every week/gi, 'cada semana')  
      .replace(/every month/gi, 'cada mes')
      .replace(/every year/gi, 'cada año')
      .replace(/for (\d+) times/gi, 'por $1 veces')
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
      .replace(/the (\d+)th/gi, '$1 de cada mes')
      .replace(/until/gi, 'hasta')
      .replace(/and/gi, 'y')
      .replace(/at/gi, 'a las')
  } catch (error) {
    console.error('Error parsing RRule:', error)
    return rruleValue.rrule
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
    const rruleValue = task.rrule as RRuleValue | null | undefined
    const status = getTaskStatus(task.completedOn, rruleValue, now)
    
    if (status === 'pending' || status === 'overdue') {
      pendingTasks.push(task)
    } else if (status === 'completed' && rruleValue && task.completedOn) {
      // Para tareas recurrentes completadas, calcular próxima fecha
      const nextDue = getNextDueDate(rruleValue, new Date(task.completedOn))
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