'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Repeat } from 'lucide-react'

import { getTaskStatus, rruleToText, classifyTasks } from '@/utils/rrule-helpers'
import type { CaseInfo, TasksListProps, TaskWithCaseInfo, TaskWithNextDue } from '@/types/cases'
import type { RRuleValue } from '@/types/rrule'
import { getTaskStatusIcon, getTaskStatusVariant, getTaskStatusText } from '@/utils/statusUtils'
import { CaseModal } from '@/components/cases/CaseModal'
import { TaskResources } from './TaskResources'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface TaskCardProps {
  task: TaskWithCaseInfo & Partial<Pick<TaskWithNextDue, 'nextDueDate'>>
  variant: 'pending' | 'upcoming'
  showCaseInfo: boolean
  onCaseClick: (caseInfo: CaseInfo) => void
  onTaskComplete?: (taskId: number) => void
}

function TaskCard({ task, variant, showCaseInfo, onCaseClick, onTaskComplete }: TaskCardProps) {
  const rruleValue = task.rrule as RRuleValue | null | undefined
  const status = variant === 'upcoming' ? 'completed' : getTaskStatus(task.lastCompletion, rruleValue)
  const isRecurring = Boolean(rruleValue)
  const canComplete =
    variant === 'pending' && (status === 'overdue' || status === 'pending') && onTaskComplete

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 p-4 sm:p-6">
        {/* Título y badges */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {getTaskStatusIcon(status)}
            <h3 className="font-semibold leading-snug">{task.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={getTaskStatusVariant(status)}>{getTaskStatusText(status)}</Badge>
            {showCaseInfo &&
              task.caseInfo?.map((caseItem) => (
                <button key={caseItem.id} type="button" onClick={() => onCaseClick(caseItem)}>
                  <Badge variant="outline" className="cursor-pointer text-primary hover:bg-accent">
                    {caseItem.title}
                  </Badge>
                </button>
              ))}
            {isRecurring && (
              <Badge variant="outline" title={rruleToText(rruleValue)}>
                <Repeat className="h-3 w-3" />
                Recurrente
              </Badge>
            )}
          </div>
        </div>

        {/* Fechas */}
        {variant === 'pending' && task.lastCompletion && (
          <p className="inline-block rounded border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            Completada: {new Date(task.lastCompletion.completedOn).toLocaleDateString('es-ES')}
          </p>
        )}
        {variant === 'upcoming' && (
          <div className="space-y-0.5 text-sm">
            {task.lastCompletion && (
              <p className="text-muted-foreground">
                Completada: {new Date(task.lastCompletion.completedOn).toLocaleDateString('es-ES')}
              </p>
            )}
            {task.nextDueDate && (
              <p className="font-medium text-primary">
                Próximo: {task.nextDueDate.toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        )}

        {/* Notas */}
        {task.notes && <p className="text-sm text-muted-foreground">{task.notes}</p>}

        {/* Recursos y acciones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <TaskResources resources={task.resources} taskId={task.id} />
          {canComplete && (
            <Button size="sm" className="w-full sm:w-auto" onClick={() => onTaskComplete(task.id)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como Completada
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function TasksList({ tasks, isLoading, onTaskComplete, showCaseInfo = false }: TasksListProps) {
  const [selectedCase, setSelectedCase] = useState<CaseInfo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleCaseClick = (caseInfo: CaseInfo) => {
    setSelectedCase(caseInfo)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedCase(null)
  }

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="flex items-center gap-3 p-4 sm:p-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p>Cargando tareas...</p>
        </CardContent>
      </Card>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No hay tareas asignadas a este caso</p>
        </CardContent>
      </Card>
    )
  }

  const { pending: pendingTasks, upcoming: upcomingTasks } = classifyTasks(tasks)

  return (
    <div className="mb-8 w-full space-y-8">
      {pendingTasks.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
            Tareas Pendientes ({pendingTasks.length})
          </h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant="pending"
                showCaseInfo={showCaseInfo}
                onCaseClick={handleCaseClick}
                onTaskComplete={onTaskComplete}
              />
            ))}
          </div>
        </section>
      )}

      {upcomingTasks.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
            Siguientes Tareas ({upcomingTasks.length})
          </h2>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant="upcoming"
                showCaseInfo={showCaseInfo}
                onCaseClick={handleCaseClick}
              />
            ))}
          </div>
        </section>
      )}

      <CaseModal open={modalOpen} onClose={handleCloseModal} caseInfo={selectedCase} />
    </div>
  )
}
