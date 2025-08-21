'use client'

import { getTaskStatus, rruleToText, classifyTasks, type TaskCompletion } from '@/utils/rrule-helpers'
import type { CaseInfo, TasksListProps } from '@/types/cases'
import type { RRuleValue } from '@/types/rrule'
import { getTaskStatusIcon, getTaskStatusColor, getTaskStatusText } from '@/utils/statusUtils'
import { CaseModal } from '@/components/cases/CaseModal'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material'
import { CheckCircle } from 'lucide-react'
import { useState } from 'react'



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
      <Card sx={{ maxWidth: '100%', mx: 'auto', mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>Cargando tareas...</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Box sx={{ width: '100%', mb: 4 }}>
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body1">
              No hay tareas asignadas a este caso
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }


  // Clasificar las tareas
  const { pending: pendingTasks, upcoming: upcomingTasks } = classifyTasks(tasks)

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* Tareas Pendientes */}
      {pendingTasks.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Tareas Pendientes ({pendingTasks.length})
          </Typography>
          <Box sx={{ mb: 3 }}>
            {pendingTasks.map((task) => {
              const rruleValue = task.rrule as RRuleValue | null | undefined
              const status = getTaskStatus(task.lastCompletion, rruleValue)
              const isRecurring = Boolean(rruleValue)
              
              return (
                <Card 
                  key={task.id}
                  sx={{ 
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getTaskStatusIcon(status )}
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {task.title}
                        </Typography>
                        <Chip
                          label={getTaskStatusText(status )}
                          size="small"
                          color={getTaskStatusColor(status ) }
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 24
                          }}
                        />
                        {showCaseInfo && task.caseInfo && task.caseInfo.map((caseItem) => (
                          <Chip
                            key={caseItem.id}
                            label={caseItem.title}
                            size="small"
                            variant="outlined"
                            color="primary"
                            clickable
                            onClick={() => handleCaseClick(caseItem)}
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 24,
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                        {isRecurring && (
                          <Tooltip 
                            title={rruleToText(rruleValue!)}
                            placement="top"
                            arrow
                          >
                            <Chip
                              label="Recurrente"
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 24
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      
                      {task.lastCompletion && (
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          fontFamily: 'monospace',
                          backgroundColor: 'background.paper',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}>
                          Completada: {new Date(task.lastCompletion.completedOn).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>

                    {/* Notes */}
                    {task.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {task.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Actions */}
                    {(status === 'overdue' || status === 'pending') && onTaskComplete && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => onTaskComplete(task.id)}
                          startIcon={<CheckCircle size={16} />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500
                          }}
                        >
                          Marcar como Completada
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Siguientes Tareas */}
      {upcomingTasks.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Siguientes Tareas ({upcomingTasks.length})
          </Typography>
          <Box sx={{ mb: 3 }}>
            {upcomingTasks.map((task) => {
              const rruleValue = task.rrule as RRuleValue | null | undefined
              const status = getTaskStatus(task.lastCompletion, rruleValue)
              const isRecurring = Boolean(rruleValue)
              
              return (
                <Card 
                  key={task.id}
                  sx={{ 
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getTaskStatusIcon(status)}
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {task.title}
                        </Typography>
                        <Chip
                          label="Completada"
                          size="small"
                          color="success"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 24
                          }}
                        />
                        {showCaseInfo && task.caseInfo && task.caseInfo.map((caseItem) => (
                          <Chip
                            key={caseItem.id}
                            label={caseItem.title}
                            size="small"
                            variant="outlined"
                            color="primary"
                            clickable
                            onClick={() => handleCaseClick(caseItem)}
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 24,
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                        {isRecurring && (
                          <Tooltip 
                            title={rruleToText(rruleValue!)}
                            placement="top"
                            arrow
                          >
                            <Chip
                              label="Recurrente"
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 24
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Fechas para tareas recurrentes */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Completada: {task.lastCompletion && new Date(task.lastCompletion.completedOn).toLocaleDateString('es-ES')}
                      </Typography>
                      <Typography variant="body2" color="primary.main">
                        Próximo: {task.nextDueDate.toLocaleDateString('es-ES')}
                      </Typography>
                    </Box>

                    {/* Notes */}
                    {task.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {task.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Case Modal */}
      <CaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        caseInfo={selectedCase}
      />
    </Box>
  )
}