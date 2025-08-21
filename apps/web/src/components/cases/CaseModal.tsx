'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Button
} from '@mui/material'
import { X, Briefcase } from 'lucide-react'
import type { CaseModalProps } from '@/types/cases'

export function CaseModal({ open, onClose, caseInfo }: CaseModalProps) {
  if (!caseInfo) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          mx: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Briefcase size={24} color="#1976d2" />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {caseInfo.title}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}>
              Caso #{caseInfo.id}
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={onClose}
          size="small"
          sx={{
            minWidth: 'auto',
            p: 1,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <X size={20} />
        </Button>
      </DialogTitle>
      
      {caseInfo.notes && (
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
            Descripción
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {caseInfo.notes}
          </Typography>
        </DialogContent>
      )}
    </Dialog>
  )
}