import type { Task, Case } from '@/payload-types'

/**
 * Case information subset used in UI components
 */
export type CaseInfo = Pick<Case, 'id' | 'title'> & {
  notes?: string | null
}

/**
 * Task enriched with case information for multiple cases
 */
export type TaskWithCaseInfo = Task & {
  caseInfo?: CaseInfo[]
}

/**
 * Task with calculated next due date for recurring tasks
 */
export type TaskWithNextDue = TaskWithCaseInfo & {
  nextDueDate: Date
}

/**
 * Classified tasks by status (pending vs upcoming)
 */
export interface ClassifiedTasks {
  pending: TaskWithCaseInfo[]
  upcoming: TaskWithNextDue[]
}

/**
 * Props for case modal component
 */
export interface CaseModalProps {
  open: boolean
  onClose: () => void
  caseInfo: CaseInfo | null
}

/**
 * Props for TasksList component
 */
export interface TasksListProps {
  tasks: TaskWithCaseInfo[]
  isLoading?: boolean
  onTaskComplete?: (taskId: number) => void
  showCaseInfo?: boolean
}

/**
 * Task status calculated from completedOn and recurrence
 */
export type TaskStatus = 'completed' | 'overdue' | 'pending'