'use client'

import { usePayloadSession } from 'payload-authjs/client'
import useSWR from 'swr'
import { getOpenCasesTasks } from '@/actions/getOpenCasesTasks'
import { getUserCases } from '@/actions/getUserCases'
import { completeTask } from '@/actions/completeTask'
import { TasksList } from '@/components/ui/TasksList'
import type { TaskWithCaseInfo } from '@/types/cases'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material'
import { CheckSquare } from 'lucide-react'
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
  const { session } = usePayloadSession()
  const user = session?.user
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all')

  // Fetch tasks (filtered or all based on selectedCaseId)
  const { data: tasks, mutate: mutateTasks, isLoading: tasksLoading } = useSWR(
    user?.id ? [user.id, selectedCaseId === 'all' ? undefined : selectedCaseId] as const : null,
    tasksFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  // Fetch user cases for dropdown
  const { data: uniqueCases } = useSWR(
    user?.id ? user.id : null,
    casesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  const handleTaskComplete = async (taskId: number) => {
    try {
      await completeTask(taskId)
      // Revalidar las tareas
      mutateTasks()
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Debes iniciar sesión para ver tus tareas
          </Typography>
        </Box>
      </Container>
    )
  }

  if (tasksLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
          <CircularProgress size={24} />
          <Typography>Cargando tareas...</Typography>
        </Box>
      </Container>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Mis Tareas
          </Typography>
          <Typography color="text.secondary">
            Tareas de todos tus casos abiertos
          </Typography>
        </Box>
        
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckSquare size={48} color="#9e9e9e" style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes tareas pendientes
            </Typography>
            <Typography color="text.secondary">
              Todas tus tareas están completadas o no tienes casos abiertos asignados.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Mis Tareas
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">
            Tareas de todos tus casos abiertos ({tasks?.length || 0} tareas{selectedCaseId !== 'all' ? ' filtradas' : ''})
          </Typography>
          {uniqueCases && uniqueCases.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por caso</InputLabel>
              <Select
                value={selectedCaseId}
                label="Filtrar por caso"
                onChange={(e) => setSelectedCaseId(e.target.value)}
                sx={{ 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  }
                }}
              >
                <MenuItem value="all">Todos los casos</MenuItem>
                {uniqueCases?.map((caseInfo) => (
                  <MenuItem key={caseInfo.id} value={caseInfo.id.toString()}>
                    {caseInfo.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      <TasksList
        tasks={tasks}
        isLoading={tasksLoading}
        onTaskComplete={handleTaskComplete}
        showCaseInfo={true}
      />
    </Container>
  )
}