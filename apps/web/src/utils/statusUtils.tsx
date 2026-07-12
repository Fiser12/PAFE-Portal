import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { TaskStatus } from '@/types/cases'

// Task status utilities
export const getTaskStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
    case 'overdue':
      return <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
    case 'pending':
      return <Clock className="h-5 w-5 shrink-0 text-amber-500" />
    default:
      return <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
  }
}

/** Variante del Badge de shadcn para cada estado de tarea */
export const getTaskStatusVariant = (
  status: TaskStatus,
): 'success' | 'error' | 'warning' | 'secondary' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'overdue':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'secondary'
  }
}

export const getTaskStatusText = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return 'Completada'
    case 'overdue':
      return 'Pendiente'
    case 'pending':
      return 'Pendiente'
    default:
      return 'Pendiente'
  }
}

// Case status utilities no longer needed since Case doesn't have status
