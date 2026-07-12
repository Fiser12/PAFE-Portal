'use client'

import { useUser } from '@/lib/auth/useUser'
import useSWR from 'swr'
import { getOpenCasesTasks } from '@/actions/getOpenCasesTasks'
import { getUserCases } from '@/actions/getUserCases'
import { completeTask } from '@/actions/completeTask'
import { TasksList } from '@/components/cases/TasksList'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckSquare, Loader2 } from 'lucide-react'
import { useState } from 'react'

const tasksFetcher = async (key: [string, string, string?]) => {
  const [userId, caseId] = key
  const result = await getOpenCasesTasks(userId, caseId)
  return result.docs
}

const casesFetcher = async (userId: string) => {
  return await getUserCases(userId)
}

export default function CasesPage() {
  const { user } = useUser()
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all')

  // Fetch tasks (filtered or all based on selectedCaseId)
  const {
    data: tasks,
    mutate: mutateTasks,
    isLoading: tasksLoading,
  } = useSWR(
    user?.id
      ? ([String(user.id), selectedCaseId === 'all' ? undefined : selectedCaseId] as const)
      : null,
    tasksFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  )

  // Fetch user cases for dropdown
  const { data: uniqueCases } = useSWR(user?.id ? String(user.id) : null, casesFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const handleTaskComplete = async (taskId: number) => {
    if (!user?.id) return

    try {
      await completeTask(taskId, String(user.id))
      // Revalidar las tareas
      mutateTasks()
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  if (!user) {
    return (
      <div className="container py-8">
        <p className="text-center text-lg font-medium">
          Debes iniciar sesión para ver tus tareas
        </p>
      </div>
    )
  }

  if (tasksLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p>Cargando tareas...</p>
        </div>
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">Mis Tareas</h1>
          <p className="text-muted-foreground">Tareas de todos tus casos abiertos</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <CheckSquare className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No tienes tareas pendientes
            </p>
            <p className="text-muted-foreground">
              Todas tus tareas están completadas o no tienes casos abiertos asignados.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Mis Tareas</h1>
          <p className="text-muted-foreground">Tareas de todos tus casos abiertos</p>
        </div>
        {uniqueCases && uniqueCases.length > 1 && (
          <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por caso">
              <SelectValue placeholder="Filtrar por caso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los casos</SelectItem>
              {uniqueCases?.map((caseInfo) => (
                <SelectItem key={caseInfo.id} value={caseInfo.id.toString()}>
                  {caseInfo.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <TasksList
        tasks={tasks}
        isLoading={tasksLoading}
        onTaskComplete={handleTaskComplete}
        showCaseInfo={true}
      />
    </div>
  )
}
