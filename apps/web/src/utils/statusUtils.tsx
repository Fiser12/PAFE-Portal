import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { TaskStatus } from '@/types/cases'

// Task status utilities
export const getTaskStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle size={20} color="#4caf50" />
    case 'overdue':
      return <AlertCircle size={20} color="#f44336" />
    case 'pending':
      return <Clock size={20} color="#ff9800" />
    default:
      return <Clock size={20} color="#757575" />
  }
}

export const getTaskStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'overdue':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'default'
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